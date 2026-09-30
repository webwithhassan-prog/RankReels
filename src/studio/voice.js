// Free voiceovers from Kokoro, an open speech model that runs in the browser. Nothing is sent to a
// server and there is no account or key. The model is downloaded once and then kept by the browser.

// Every English voice the model ships with, clearest first within each group.
export const VOICE_GROUPS = [
  {
    label: 'American, female',
    voices: [
      { id: 'af_heart', name: 'Heart', note: 'clearest' },
      { id: 'af_bella', name: 'Bella', note: 'clearest' },
      { id: 'af_nicole', name: 'Nicole', note: 'soft' },
      { id: 'af_aoede', name: 'Aoede' },
      { id: 'af_kore', name: 'Kore' },
      { id: 'af_sarah', name: 'Sarah' },
      { id: 'af_alloy', name: 'Alloy' },
      { id: 'af_nova', name: 'Nova' },
      { id: 'af_sky', name: 'Sky' },
      { id: 'af_jessica', name: 'Jessica' },
      { id: 'af_river', name: 'River' },
    ],
  },
  {
    label: 'American, male',
    voices: [
      { id: 'am_fenrir', name: 'Fenrir' },
      { id: 'am_michael', name: 'Michael' },
      { id: 'am_puck', name: 'Puck' },
      { id: 'am_echo', name: 'Echo' },
      { id: 'am_eric', name: 'Eric' },
      { id: 'am_liam', name: 'Liam' },
      { id: 'am_onyx', name: 'Onyx' },
      { id: 'am_santa', name: 'Santa' },
      { id: 'am_adam', name: 'Adam' },
    ],
  },
  {
    label: 'British, female',
    voices: [
      { id: 'bf_emma', name: 'Emma' },
      { id: 'bf_isabella', name: 'Isabella' },
      { id: 'bf_alice', name: 'Alice' },
      { id: 'bf_lily', name: 'Lily' },
    ],
  },
  {
    label: 'British, male',
    voices: [
      { id: 'bm_george', name: 'George' },
      { id: 'bm_fable', name: 'Fable' },
      { id: 'bm_lewis', name: 'Lewis' },
      { id: 'bm_daniel', name: 'Daniel' },
    ],
  },
];

export const VOICE_COUNT = VOICE_GROUPS.reduce((sum, group) => sum + group.voices.length, 0);
export const DEFAULT_VOICE = 'af_heart';

const GAP_SECONDS = 0.18;
// The model reads a limited stretch at a time, so a very long sentence is broken at its commas.
const LONGEST_PIECE = 280;

function voiceName(id) {
  for (const group of VOICE_GROUPS) {
    const voice = group.voices.find((v) => v.id === id);
    if (voice) return voice.name;
  }
  return 'Voice';
}

export function splitSentences(script) {
  const sentences = script.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*["')\]]*\s*/g) ?? [];
  return sentences
    .flatMap((sentence) => (sentence.length > LONGEST_PIECE ? sentence.match(/[^,;:]+[,;:]?\s*/g) : [sentence]))
    .map((piece) => piece.trim())
    .filter(Boolean);
}

function encodeWav(samples, rate) {
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return view.buffer;
}

function joinParts(parts, rate) {
  const gap = Math.round(rate * GAP_SECONDS);
  const total = parts.reduce((sum, part) => sum + part.length, 0) + gap * (parts.length - 1);
  const samples = new Float32Array(total);
  let at = 0;
  for (const part of parts) {
    samples.set(part, at);
    at += part.length + gap;
  }
  return samples;
}

let worker;
let nextJob = 1;

// Speaks the script in the chosen voice and resolves with the take as a WAV file.
// `onProgress` gets { phase: 'download', fraction } then { phase: 'speaking', done, of }.
export function speak(script, voice, speed, onProgress) {
  const sentences = splitSentences(script);
  if (!sentences.length) return Promise.reject(new Error('Write the script first.'));

  worker ||= new Worker(new URL('./voice.worker.js', import.meta.url), { type: 'module' });
  const id = nextJob++;

  return new Promise((resolve, reject) => {
    const stop = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };
    const onError = () => {
      stop();
      worker.terminate();
      worker = undefined;
      reject(new Error('The voice model stopped unexpectedly. Reload the page and generate again.'));
    };
    const onMessage = ({ data }) => {
      if (data.id !== id) return;
      if (data.type === 'download') onProgress({ phase: 'download', fraction: data.total ? data.loaded / data.total : 0 });
      if (data.type === 'speaking') onProgress({ phase: 'speaking', done: data.done, of: data.of });
      if (data.type === 'error') {
        stop();
        reject(new Error(data.message));
      }
      if (data.type === 'done') {
        stop();
        const wav = encodeWav(joinParts(data.parts, data.rate), data.rate);
        resolve(new File([wav], `${voiceName(voice)} voiceover.wav`, { type: 'audio/wav' }));
      }
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({ id, sentences, voice, speed });
  });
}
