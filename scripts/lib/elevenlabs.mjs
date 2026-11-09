import './net.mjs';

const BASE = 'https://api.elevenlabs.io';

// In the cloud sandbox the proxy injects the real key; locally set ELEVENLABS_API_KEY.
const headers = (extra = {}) => ({
  'xi-api-key': process.env.ELEVENLABS_API_KEY || 'proxy-injected',
  ...extra,
});

export const el = async (path, {method = 'GET', body, query} = {}) => {
  const url = new URL(BASE + path);
  Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    method,
    headers: headers(body ? {'Content-Type': 'application/json'} : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${method} ${path} -> ${res.status}: ${text.slice(0, 600)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Text-to-speech with character-level timestamps. Returns {audio: Buffer(mp3), alignment}.
export const ttsWithTimestamps = async ({voiceId, text, modelId, previousText, nextText, settings, languageCode, seed}) => {
  const body = {
    text,
    model_id: modelId,
    voice_settings: settings,
    ...(languageCode ? {language_code: languageCode} : {}),
    ...(seed !== undefined ? {seed} : {}),
    ...(previousText ? {previous_text: previousText} : {}),
    ...(nextText ? {next_text: nextText} : {}),
  };
  const json = await el(`/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST',
    body,
    query: {output_format: 'mp3_44100_128'},
  });
  return {audio: Buffer.from(json.audio_base64, 'base64'), alignment: json.alignment || json.normalized_alignment};
};

export const subscription = () => el('/v1/user/subscription');
