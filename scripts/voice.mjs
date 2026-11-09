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
const TAIL = 2.2; // seconds after the last word (end card)

const id = process.argv[2];
const force = process.argv.includes('--force');
const qa = process.argv.includes('--qa');
if (!id) {
  console.error('usage: node scripts/voice.mjs <episode-id> [--force] [--qa]');
  process.exit(1);
}

const script = JSON.parse(readFileSync(`videos/${id}/script.json`, 'utf8'));
const leeshoVoice = JSON.parse(readFileSync('voices/leesho.json', 'utf8'));
const voice = {
  voiceId: script.voice?.voiceId || leeshoVoice.voice_id,
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

const hash = createHash('sha1').update(JSON.stringify({fullText, voice})).digest('hex').slice(0, 12);
const cachePath = `${outDir}/tts-cache.json`;
let tts;
if (!force && existsSync(cachePath) && existsSync(`${outDir}/voice.mp3`)) {
  const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
  if (cache.hash === hash) tts = cache;
}
if (!tts) {
  console.log(`TTS: ${fullText.length} chars, model ${voice.model}...`);
  const r = await ttsWithTimestamps({
    voiceId: voice.voiceId,
    text: fullText,
    modelId: voice.model,
    languageCode: script.language || 'ar',
    seed: voice.seed,
    settings: {stability: voice.stability, similarity_boost: voice.similarity},
  });
  writeFileSync(`${outDir}/voice.mp3`, r.audio);
  tts = {hash, alignment: r.alignment};
  writeFileSync(cachePath, JSON.stringify(tts));
} else {
  console.log('TTS: cached (text unchanged)');
}

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
  fps: FPS,
  format: script.format || 'short',
  theme: script.theme || 'night',
  title: script.title,
  thumbnail: script.thumbnail,
  youtube: script.youtube,
  durationInFrames: Math.ceil(total * FPS),
  voice: {file: `episodes/${id}/voice.mp3`, offset: LEAD_IN, duration: voiceDuration},
  music: script.music ?? {file: 'music/leesho-loop.wav', volume: 0.07},
  envelope,
  scenes,
};
writeFileSync(`${outDir}/episode.json`, JSON.stringify(episode));
console.log(`episode.json: ${scenes.length} scenes, ${total.toFixed(1)}s, ${scenes.reduce((n, s) => n + s.words.length, 0)} words`);

if (qa) {
  const {transcribe, wer} = await import('./lib/stt.mjs');
  const r = await transcribe(`${outDir}/voice.mp3`);
  const ref = fullText.replace(/\[[^\]]*\]/g, ' ');
  console.log(`QA word error rate: ${(wer(ref, r.text) * 100).toFixed(1)}%`);
  console.log('heard:', r.text);
}
