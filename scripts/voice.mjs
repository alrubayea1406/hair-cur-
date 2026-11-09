// Generate the voice track for one episode and everything the video needs from it:
//   node scripts/voice.mjs <episode-id> [--force] [--qa]
// Reads  videos/<id>/script.json
// Writes public/episodes/<id>/voice.mp3 + episode.json (scene times, word times, lip-sync envelope)
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {ttsWithTimestamps} from './lib/elevenlabs.mjs';

const FPS = 30;
const LEAD_IN = 0.2; // seconds of silence before the first word
const TAIL = 2.5; // seconds after the last word (end card)

const id = process.argv[2];
const force = process.argv.includes('--force');
const qa = process.argv.includes('--qa');
if (!id) {
  console.error('usage: node scripts/voice.mjs <episode-id> [--force] [--qa]');
  process.exit(1);
}

const script = JSON.parse(readFileSync(`videos/${id}/script.json`, 'utf8'));
const hostVoice = JSON.parse(readFileSync(`voices/${script.voice?.name || 'sterling'}.json`, 'utf8'));
const voice = {
  voiceId: script.voice?.voiceId || hostVoice.voice_id,
  model: script.voice?.model || 'eleven_v3',
  stability: script.voice?.stability ?? 0.5,
  similarity: script.voice?.similarity ?? 0.8,
  seed: script.voice?.seed ?? 7,
};

const outDir = `public/episodes/${id}`;
mkdirSync(outDir, {recursive: true});

// ---------- 1. full text + where every scene starts in it ----------
let fullText = '';
const sceneRanges = script.scenes.map((s, i) => {
  if (i > 0) fullText += ' ';
  const start = fullText.length;
  fullText += s.say.trim();
  return {start, end: fullText.length};
});

// ---------- TTS in chunks of whole scenes (long requests time out; edits only redo one chunk) ----------
const MAX_CHUNK = 900;
const chunks = [];
{
  let cur = null;
  script.scenes.forEach((s) => {
    const say = s.say.trim();
    if (cur && cur.text.length + 1 + say.length > MAX_CHUNK) {
      chunks.push(cur);
      cur = null;
    }
    cur = cur ? {text: `${cur.text} ${say}`} : {text: say};
  });
  if (cur) chunks.push(cur);
}
const chunkDir = `${outDir}/chunks`;
mkdirSync(chunkDir, {recursive: true});
const ffmpeg = (args) => execFileSync('ffmpeg', ['-v', 'quiet', '-y', ...args]);
let usedChars = 0;
for (const c of chunks) {
  c.hash = createHash('sha1').update(JSON.stringify({text: c.text, voice})).digest('hex').slice(0, 12);
  const mp3 = `${chunkDir}/${c.hash}.mp3`;
  const meta = `${chunkDir}/${c.hash}.json`;
  if (force || !existsSync(mp3) || !existsSync(meta)) {
    console.log(`TTS chunk ${c.hash}: ${c.text.length} chars...`);
    let r;
    for (let attempt = 1; ; attempt++) {
      try {
        r = await ttsWithTimestamps({
          voiceId: voice.voiceId,
          text: c.text,
          modelId: voice.model,
          languageCode: script.language || 'en',
          seed: voice.seed,
          settings: {stability: voice.stability, similarity_boost: voice.similarity},
        });
        break;
      } catch (err) {
        if (attempt >= 3) throw err;
        console.warn(`  retry ${attempt}: ${err.message.slice(0, 120)}`);
        await new Promise((res) => setTimeout(res, 4000 * attempt));
      }
    }
    writeFileSync(mp3, r.audio);
    writeFileSync(meta, JSON.stringify(r.alignment));
    usedChars += c.text.length;
  }
  ffmpeg(['-i', mp3, '-ar', '44100', '-ac', '1', `${chunkDir}/${c.hash}.wav`]);
  c.duration = Number(execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${chunkDir}/${c.hash}.wav`]).toString());
  c.alignment = JSON.parse(readFileSync(meta, 'utf8'));
}
console.log(usedChars ? `TTS: generated ${usedChars} chars in ${chunks.length} chunk(s)` : 'TTS: all chunks cached');

// join chunk audio + alignment (chunks are joined by one space, exactly like fullText)
writeFileSync(`${chunkDir}/list.txt`, chunks.map((c) => `file '${c.hash}.wav'`).join('\n'));
ffmpeg(['-f', 'concat', '-safe', '0', '-i', `${chunkDir}/list.txt`, '-c:a', 'libmp3lame', '-b:a', '192k', `${outDir}/voice.mp3`]);
const tts = {alignment: {characters: [], character_start_times_seconds: [], character_end_times_seconds: []}};
{
  let offset = 0;
  chunks.forEach((c, k) => {
    const a = tts.alignment;
    if (k > 0) {
      a.characters.push(' ');
      a.character_start_times_seconds.push(offset);
      a.character_end_times_seconds.push(offset);
    }
    c.alignment.characters.forEach((ch, i) => {
      a.characters.push(ch);
      a.character_start_times_seconds.push(c.alignment.character_start_times_seconds[i] + offset);
      a.character_end_times_seconds.push(c.alignment.character_end_times_seconds[i] + offset);
    });
    offset += c.duration;
  });
}
execFileSync('sh', ['-c', `rm -f ${chunkDir}/*.wav ${chunkDir}/list.txt`]);

// ---------- 2. map text positions -> alignment positions ----------
const al = tts.alignment;
const chars = al.characters;
const starts = al.character_start_times_seconds;
const ends = al.character_end_times_seconds;
const posMap = new Array(fullText.length).fill(-1);
{
  let j = 0;
  for (let i = 0; i < fullText.length && j < chars.length; i++) {
    if (fullText[i] === chars[j]) {
      posMap[i] = j++;
    } else {
      // look ahead a little in the alignment for a re-sync
      const k = chars.indexOf(fullText[i], j);
      if (k !== -1 && k - j < 6) {
        j = k;
        posMap[i] = j++;
      }
    }
  }
  if (chars.join('') !== fullText) console.warn('warning: alignment text differs from input, used fuzzy mapping');
}
const timeAt = (i, which) => {
  for (let d = 0; d < 40; d++) {
    const a = posMap[i + (which === 'start' ? d : -d)];
    if (a !== undefined && a >= 0) return which === 'start' ? starts[a] : ends[a];
  }
  return null;
};

// ---------- 3. words per scene ----------
const stripTashkeel = (s) => s.replace(/[ً-ْٰـ]/g, '');
const scenes = script.scenes.map((s, si) => {
  const {start: s0, end: s1} = sceneRanges[si];
  const words = [];
  const re = /\[[^\]]*\]|[^\s]+/g;
  const text = fullText.slice(s0, s1);
  let m;
  while ((m = re.exec(text))) {
    if (m[0].startsWith('[')) continue; // audio tags like [excited] are not shown
    const a = s0 + m.index;
    const b = a + m[0].length - 1;
    const ws = timeAt(a, 'start');
    const we = timeAt(b, 'end');
    if (ws === null || we === null) continue;
    const display = stripTashkeel(m[0]).replace(/\.\.\.|…/g, '');
    if (!display.trim()) continue;
    words.push({text: display, start: ws + LEAD_IN, end: we + LEAD_IN});
  }
  return {...s, words};
});

const voiceDuration = Number(
  execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${outDir}/voice.mp3`]).toString(),
);
scenes.forEach((s, i) => {
  s.start = i === 0 ? 0 : s.words[0]?.start ?? scenes[i - 1].start + 0.5;
});
const total = LEAD_IN + voiceDuration + TAIL;
scenes.forEach((s, i) => {
  s.end = i < scenes.length - 1 ? scenes[i + 1].start : total;
});

// ---------- 4. lip-sync envelope (loudness per video frame) ----------
const pcm = execFileSync('ffmpeg', ['-v', 'quiet', '-i', `${outDir}/voice.mp3`, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], {
  maxBuffer: 1024 * 1024 * 200,
});
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
const spf = 16000 / FPS;
const rms = [];
for (let f = 0; f * spf < samples.length; f++) {
  let sum = 0;
  const a = Math.floor(f * spf);
  const b = Math.min(samples.length, Math.floor((f + 1) * spf));
  for (let i = a; i < b; i++) sum += (samples[i] / 32768) ** 2;
  rms.push(Math.sqrt(sum / Math.max(1, b - a)));
}
const sorted = [...rms].sort((x, y) => x - y);
const p92 = sorted[Math.floor(sorted.length * 0.92)] || 0.1;
const floor = 0.012;
const leadFrames = Math.round(LEAD_IN * FPS);
const envelope = [
  ...Array(leadFrames).fill(0),
  ...rms.map((v) => Number(Math.min(1, Math.max(0, (v - floor) / (p92 - floor)) ** 0.8).toFixed(3))),
];

// ---------- 5. icons used by props (Fluent Emoji Flat, MIT) ----------
const require = createRequire(import.meta.url);
const {getIconData, iconToSVG, iconToHTML, replaceIDs} = require('@iconify/utils');
const iconSet = require('@iconify-json/fluent-emoji-flat/icons.json');
const iconNames = new Set(['bell']);
scenes.forEach((s) => (s.props || []).forEach((p) => iconNames.add(p.icon)));
(script.thumbnail?.icons || []).forEach((n) => iconNames.add(n));
scenes.forEach((s) => (s.props || []).forEach((p) => { if (p.type && p.type !== 'icon') iconNames.delete(p.icon); }));
iconNames.delete(undefined);
const icons = {};
for (const name of iconNames) {
  const data = getIconData(iconSet, name);
  if (!data) {
    const like = Object.keys(iconSet.icons).filter((n) => n.includes(name.split('-')[0])).slice(0, 8);
    throw new Error(`Unknown icon "${name}". Similar: ${like.join(', ')}  (search: node scripts/find-icon.mjs <word>)`);
  }
  const svg = iconToSVG(data, {width: '100%', height: '100%'});
  icons[name] = iconToHTML(replaceIDs(svg.body, `${name}-`), svg.attributes);
}

const episode = {
  id,
  icons,
  captions: script.captions ?? {landscape: false, vertical: true},
  shorts: script.shorts ?? [],
  fps: FPS,
  theme: script.theme || 'studio',
  title: script.title,
  thumbnail: script.thumbnail,
  youtube: script.youtube,
  durationInFrames: Math.ceil(total * FPS),
  voice: {file: `episodes/${id}/voice.mp3`, offset: LEAD_IN, duration: voiceDuration},
  music: script.music ?? {file: 'music/lofi-loop.wav', volume: 0.06},
  envelope,
  scenes,
};
writeFileSync(`${outDir}/episode.json`, JSON.stringify(episode));
console.log(`episode.json: ${scenes.length} scenes, ${total.toFixed(1)}s, ${scenes.reduce((n, s) => n + s.words.length, 0)} words`);

if (qa) {
  const {transcribe, wer} = await import('./lib/stt.mjs');
  const r = await transcribe(`${outDir}/voice.mp3`, {languageCode: script.language || 'en'});
  const ref = fullText.replace(/\[[^\]]*\]/g, ' ');
  console.log(`QA word error rate: ${(wer(ref, r.text) * 100).toFixed(1)}%`);
  console.log('heard:', r.text);
}
