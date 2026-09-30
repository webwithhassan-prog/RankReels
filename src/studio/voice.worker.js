import { KokoroTTS } from 'kokoro-js';

// Runs the speech model off the main thread, so the editor stays responsive while a voiceover is being made.
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let loading;

function loadModel(onDownload) {
  loading ||= KokoroTTS.from_pretrained(MODEL, {
    dtype: 'q8',
    device: 'wasm',
    progress_callback: (progress) => {
      if (progress.status === 'progress' && progress.file?.endsWith('.onnx')) onDownload(progress.loaded, progress.total);
    },
  }).catch((error) => {
    // A failed download must not be remembered, or every later attempt would fail without retrying.
    loading = undefined;
    throw error;
  });
  return loading;
}

self.onmessage = async ({ data }) => {
  const { id, sentences, voice, speed } = data;
  try {
    const tts = await loadModel((loaded, total) => self.postMessage({ id, type: 'download', loaded, total }));
    const parts = [];
    let rate = 24000;
    for (let i = 0; i < sentences.length; i++) {
      self.postMessage({ id, type: 'speaking', done: i, of: sentences.length });
      const audio = await tts.generate(sentences[i], { voice, speed });
      parts.push(audio.audio);
      rate = audio.sampling_rate;
    }
    self.postMessage({ id, type: 'done', parts, rate }, parts.map((part) => part.buffer));
  } catch (error) {
    self.postMessage({ id, type: 'error', message: String(error?.message || error) });
  }
};
