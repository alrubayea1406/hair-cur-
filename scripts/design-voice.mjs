// Design a unique voice with ElevenLabs Voice Design.
//   node scripts/design-voice.mjs previews <name>     -> 3 candidates into voices/previews/<name>-N.mp3
//   node scripts/design-voice.mjs save <name> <1|2|3> -> saves the chosen one, writes voices/<name>.json
// The description + sample text live in voices/<name>.design.json
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {el} from './lib/elevenlabs.mjs';

const [cmd, name, pick] = process.argv.slice(2);
if (!cmd || !name) {
  console.log('usage: node scripts/design-voice.mjs previews <name> | save <name> <n>');
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(`voices/${name}.design.json`, 'utf8'));
const DIR = 'voices/previews';
mkdirSync(DIR, {recursive: true});

if (cmd === 'previews') {
  const json = await el('/v1/text-to-voice/design', {
    method: 'POST',
    query: {output_format: 'mp3_44100_128'},
    body: {voice_description: cfg.description, model_id: cfg.model || 'eleven_ttv_v3', text: cfg.sample, guidance_scale: 5, loudness: 0.6},
  });
  const previews = json.previews.map((p, i) => {
    const file = `${DIR}/${name}-${i + 1}.mp3`;
    writeFileSync(file, Buffer.from(p.audio_base_64, 'base64'));
    return {n: i + 1, file, generated_voice_id: p.generated_voice_id, duration_secs: p.duration_secs, language: p.language};
  });
  writeFileSync(`${DIR}/${name}.json`, JSON.stringify({text: json.text ?? cfg.sample, previews}, null, 2));
  console.log(JSON.stringify(previews, null, 2));
} else if (cmd === 'save') {
  const {previews} = JSON.parse(readFileSync(`${DIR}/${name}.json`, 'utf8'));
  const chosen = previews.find((p) => p.n === Number(pick));
  if (!chosen) throw new Error('choose 1, 2 or 3');
  const saved = await el('/v1/text-to-voice', {
    method: 'POST',
    body: {voice_name: cfg.name, voice_description: cfg.description, generated_voice_id: chosen.generated_voice_id},
  });
  const out = {name: cfg.name, voice_id: saved.voice_id, from_preview: chosen.n};
  writeFileSync(`voices/${name}.json`, JSON.stringify(out, null, 2));
  console.log(out);
}
