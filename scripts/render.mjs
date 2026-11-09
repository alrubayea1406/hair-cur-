// Render an episode:  node scripts/render.mjs <episode-id> [--frames=10,200,400] [--scale=0.5] [--no-video]
// Outputs to out/<id>/ : <id>.mp4, thumbnail.png, youtube.txt  (or preview frames with --frames)
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const HEADLESS =
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = existsSync(HEADLESS) ? HEADLESS : null;

const id = process.argv[2];
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
if (!id) {
  console.error('usage: node scripts/render.mjs <episode-id> [--frames=..] [--scale=..] [--no-video]');
  process.exit(1);
}
const episodePath = `public/episodes/${id}/episode.json`;
if (!existsSync(episodePath)) {
  console.error(`Missing ${episodePath} — run: node scripts/voice.mjs ${id}`);
  process.exit(1);
}
const episode = JSON.parse(readFileSync(episodePath, 'utf8'));
const outDir = `out/${id}`;
mkdirSync(outDir, {recursive: true});

console.log('Bundling...');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const inputProps = {episodeId: id};
const compId = episode.format === 'long' ? 'Long' : 'Short';
const composition = await selectComposition({serveUrl, id: compId, inputProps, browserExecutable});

const frames = arg('frames');
if (frames) {
  const scale = Number(arg('scale') ?? 0.5);
  for (const fr of frames.split(',').map(Number)) {
    const output = `${outDir}/frame-${String(fr).padStart(5, '0')}.png`;
    await renderStill({composition, serveUrl, output, frame: fr, inputProps, scale, browserExecutable});
    console.log('still', output);
  }
  process.exit(0);
}

if (!process.argv.includes('--no-video')) {
  const output = `${outDir}/${id}.mp4`;
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 18,
    audioBitrate: '192k',
    imageFormat: 'jpeg',
    jpegQuality: 92,
    outputLocation: output,
    inputProps,
    browserExecutable,
    concurrency: 4,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        console.log(`render ${p * 10}%`);
      }
    },
  });
  console.log('video', output);
}

for (const [cid, file] of [
  [episode.format === 'long' ? 'ThumbnailWide' : 'ThumbnailShort', 'thumbnail.png'],
]) {
  const comp = await selectComposition({serveUrl, id: cid, inputProps, browserExecutable});
  await renderStill({composition: comp, serveUrl, output: `${outDir}/${file}`, frame: 45, inputProps, browserExecutable});
  console.log('thumbnail', `${outDir}/${file}`);
}

const yt = episode.youtube;
if (yt) {
  const txt = [
    `TITLE:\n${yt.title}`,
    `DESCRIPTION:\n${yt.description}`,
    `TAGS:\n${(yt.tags || []).join(', ')}`,
    `MADE FOR KIDS: ${yt.madeForKids ? 'yes' : 'no'}`,
    `CATEGORY: ${yt.category || 'Education'}`,
  ].join('\n\n');
  writeFileSync(`${outDir}/youtube.txt`, txt + '\n');
  console.log('metadata', `${outDir}/youtube.txt`);
}
