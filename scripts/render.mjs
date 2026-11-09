// Render an episode (long video + Shorts + thumbnails + YouTube metadata):
//   node scripts/render.mjs <episode-id>                 everything
//   node scripts/render.mjs <episode-id> --only=long     (long | shorts | thumbs | meta)
//   node scripts/render.mjs <episode-id> --frames=100,500 [--comp=ShortClip --short=0] [--scale=0.5]   preview stills
// Outputs go to out/<id>/
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const HEADLESS = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = existsSync(HEADLESS) ? HEADLESS : null;

const id = process.argv[2];
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
if (!id) {
  console.error('usage: node scripts/render.mjs <episode-id> [--only=long|shorts|thumbs|meta] [--frames=..]');
  process.exit(1);
}
const epPath = `public/episodes/${id}/episode.json`;
if (!existsSync(epPath)) {
  console.error(`Missing ${epPath} — run: node scripts/voice.mjs ${id}`);
  process.exit(1);
}
const ep = JSON.parse(readFileSync(epPath, 'utf8'));
const outDir = `out/${id}`;
mkdirSync(outDir, {recursive: true});
const only = arg('only');
const want = (k) => !only || only === k;

// ---------- metadata (no rendering needed) ----------
const ts = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};
const srtTime = (sec) => {
  const ms = Math.round(sec * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};
const writeMeta = () => {
  const yt = ep.youtube ?? {};
  const chapters = ep.scenes.filter((s) => s.chapter).map((s, i) => `${i === 0 ? '0:00' : ts(s.start)} ${s.chapter}`);
  const desc = [yt.description ?? '', chapters.length >= 3 ? `\nChapters:\n${chapters.join('\n')}` : '', yt.footer ? `\n${yt.footer}` : '']
    .join('\n')
    .trim();
  writeFileSync(
    `${outDir}/youtube.txt`,
    [`TITLE:\n${yt.title ?? ep.title}`, `DESCRIPTION:\n${desc}`, `TAGS:\n${(yt.tags ?? []).join(', ')}`, `AUDIENCE: Not made for kids`, `CATEGORY: ${yt.category ?? 'Education'}`].join('\n\n') + '\n',
  );
  // English subtitles file for YouTube (Studio -> Subtitles -> Upload file)
  const lines = [];
  ep.scenes.forEach((s) => {
    let cur = [];
    const flush = () => {
      if (cur.length) lines.push({start: cur[0].start, end: cur[cur.length - 1].end, text: cur.map((w) => w.text).join(' ')});
      cur = [];
    };
    s.words.forEach((w) => {
      cur.push(w);
      if (cur.length >= 8 || /[.?!]$/.test(w.text)) flush();
    });
    flush();
  });
  writeFileSync(`${outDir}/captions.srt`, lines.map((l, i) => `${i + 1}\n${srtTime(l.start)} --> ${srtTime(l.end + 0.1)}\n${l.text}\n`).join('\n'));
  (ep.shorts ?? []).forEach((sh, i) => {
    const y = sh.youtube ?? {};
    writeFileSync(
      `${outDir}/short-${i + 1}-${sh.id}.txt`,
      [`TITLE:\n${y.title ?? sh.hook}`, `DESCRIPTION:\n${y.description ?? ''}`, `TAGS:\n${(y.tags ?? []).join(', ')}`].join('\n\n') + '\n',
    );
  });
  console.log('metadata: youtube.txt, captions.srt, short-*.txt');
};
if (want('meta')) writeMeta();
if (only === 'meta') process.exit(0);

console.log('Bundling...');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});

const frames = arg('frames');
if (frames) {
  const compId = arg('comp') ?? 'Long';
  const inputProps = {episodeId: id, short: Number(arg('short') ?? 0)};
  const composition = await selectComposition({serveUrl, id: compId, inputProps, browserExecutable});
  for (const fr of frames.split(',').map(Number)) {
    const output = `${outDir}/frame-${compId}-${String(fr).padStart(5, '0')}.png`;
    await renderStill({composition, serveUrl, output, frame: fr, inputProps, scale: Number(arg('scale') ?? 0.5), browserExecutable});
    console.log('still', output);
  }
  process.exit(0);
}

const renderVideo = async (compId, inputProps, output) => {
  const composition = await selectComposition({serveUrl, id: compId, inputProps, browserExecutable});
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 20,
    audioBitrate: '192k',
    imageFormat: 'jpeg',
    jpegQuality: 90,
    outputLocation: output,
    inputProps,
    browserExecutable,
    concurrency: 4,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        console.log(`${path.basename(output)} ${p * 10}%`);
      }
    },
  });
  console.log('video', output);
};

if (want('long')) await renderVideo('Long', {episodeId: id}, `${outDir}/${id}.mp4`);
if (want('shorts')) {
  for (let i = 0; i < (ep.shorts ?? []).length; i++) {
    await renderVideo('ShortClip', {episodeId: id, short: i}, `${outDir}/short-${i + 1}-${ep.shorts[i].id}.mp4`);
  }
}
if (want('thumbs')) {
  for (const [cid, file] of [
    ['ThumbnailWide', 'thumbnail.png'],
    ['ThumbnailVertical', 'thumbnail-vertical.png'],
  ]) {
    const comp = await selectComposition({serveUrl, id: cid, inputProps: {episodeId: id}, browserExecutable});
    await renderStill({composition: comp, serveUrl, output: `${outDir}/${file}`, frame: 45, inputProps: {episodeId: id}, browserExecutable});
    console.log('thumbnail', `${outDir}/${file}`);
  }
}
