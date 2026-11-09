// Design a unique voice for Leesho with ElevenLabs Voice Design.
//   node scripts/design-voice.mjs previews        -> generates 3 candidate voices into voices/previews/
//   node scripts/design-voice.mjs save <1|2|3>    -> saves the chosen candidate to the account, writes voices/leesho.json
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {el} from './lib/elevenlabs.mjs';

const DIR = 'voices/previews';
const DESCRIPTION =
  'A cheerful, curious little cartoon creature with a bright, playful, slightly high-pitched young male voice. ' +
  'Native Arabic speaker with clear, warm Modern Standard Arabic pronunciation. Energetic and expressive like a fun ' +
  'YouTube science-explainer host, smiling while he talks, lively pace but always clear. Clean studio recording, no background noise.';
const SAMPLE =
  'مرحباً! أنا ليشو، وهذا الهوائيّ فوق رأسي علامةُ استفهام. كلَّ يوم أسألُ سؤالاً غريباً: ليش السماء زرقاء؟ ' +
  'ليش نتثاءب؟ ثم أبحثُ عن الجواب معكم... ولمّا ألقاه، يصيرُ الهوائيُّ علامةَ تعجّب! يلّا بنا!';

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'previews') {
  mkdirSync(DIR, {recursive: true});
  const json = await el('/v1/text-to-voice/design', {
    method: 'POST',
    query: {output_format: 'mp3_44100_128'},
    body: {
      voice_description: DESCRIPTION,
      model_id: process.env.TTV_MODEL || 'eleven_ttv_v3',
      text: SAMPLE,
      guidance_scale: 5,
      loudness: 0.6,
    },
  });
  const meta = json.previews.map((p, i) => {
    const file = `${DIR}/leesho-voice-${i + 1}.mp3`;
    writeFileSync(file, Buffer.from(p.audio_base_64, 'base64'));
    return {n: i + 1, file, generated_voice_id: p.generated_voice_id, duration_secs: p.duration_secs, language: p.language};
  });
  writeFileSync(`${DIR}/previews.json`, JSON.stringify({description: DESCRIPTION, text: json.text ?? SAMPLE, previews: meta}, null, 2));
  console.log(JSON.stringify(meta, null, 2));
} else if (cmd === 'save') {
  const {previews} = JSON.parse(readFileSync(`${DIR}/previews.json`, 'utf8'));
  const pick = previews.find((p) => p.n === Number(arg));
  if (!pick) throw new Error('Choose 1, 2 or 3');
  const saved = await el('/v1/text-to-voice', {
    method: 'POST',
    body: {voice_name: 'Leesho', voice_description: DESCRIPTION, generated_voice_id: pick.generated_voice_id},
  });
  const out = {name: 'Leesho', voice_id: saved.voice_id, from_preview: pick.n};
  writeFileSync('voices/leesho.json', JSON.stringify(out, null, 2));
  console.log(out);
} else {
  console.log('usage: node scripts/design-voice.mjs previews | save <n>');
}
