import './net.mjs';
import {readFileSync} from 'node:fs';

// ElevenLabs Speech-to-Text (Scribe): used for QA (did the voice say the words right?)
export const transcribe = async (file, {languageCode = 'ar', model = 'scribe_v1'} = {}) => {
  const form = new FormData();
  form.append('model_id', model);
  form.append('language_code', languageCode);
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  form.append('file', new Blob([readFileSync(file)], {type: 'audio/mpeg'}), file.split('/').pop());
  const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY || 'proxy-injected'},
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`STT ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
};

// Normalise Arabic for comparison: strip diacritics/tatweel/punctuation, unify alef/ya/ta-marbuta.
export const normAr = (s) =>
  s
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

// word error rate via edit distance
export const wer = (ref, hyp) => {
  const r = normAr(ref);
  const h = normAr(hyp);
  const d = Array.from({length: r.length + 1}, (_, i) => [i, ...Array(h.length).fill(0)]);
  for (let j = 1; j <= h.length; j++) d[0][j] = j;
  for (let i = 1; i <= r.length; i++)
    for (let j = 1; j <= h.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1));
  return d[r.length][h.length] / Math.max(1, r.length);
};
