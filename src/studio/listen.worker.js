import { pipeline } from '@huggingface/transformers';

// Listens to the voice off the main thread and reports when each word is said. The model is a small
// English speech recogniser that runs on this device; nothing is uploaded.
const MODEL = 'onnx-community/whisper-tiny.en_timestamped';

let loading;

function loadModel(onDownload) {
  loading ||= pipeline('automatic-speech-recognition', MODEL, {
    // The listening half is kept at full precision, where shrinking it costs the most accuracy.
    dtype: { encoder_model: 'fp32', decoder_model_merged: 'q8' },
    device: 'wasm',
    progress_callback: (progress) => {
      if (progress.status === 'progress' && progress.file?.endsWith('.onnx')) onDownload(progress.file, progress.loaded, progress.total);
    },
  }).catch((error) => {
    // A failed download must not be remembered, or every later attempt would fail without retrying.
    loading = undefined;
    throw error;
  });
  return loading;
}

self.onmessage = async ({ data }) => {
  const { id, samples } = data;
  try {
    const sizes = new Map();
    const listen = await loadModel((file, loaded, total) => {
      sizes.set(file, { loaded, total });
      let done = 0;
      let all = 0;
      for (const size of sizes.values()) {
        done += size.loaded;
        all += size.total;
      }
      self.postMessage({ id, type: 'download', loaded: done, total: all });
    });
    self.postMessage({ id, type: 'listening' });
    const result = await listen(samples, { return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
    const words = (result.chunks ?? [])
      .map((chunk) => ({ text: chunk.text.trim(), start: chunk.timestamp[0], end: chunk.timestamp[1] ?? chunk.timestamp[0] + 0.3 }))
      .filter((word) => word.text && Number.isFinite(word.start));
    self.postMessage({ id, type: 'done', words });
  } catch (error) {
    self.postMessage({ id, type: 'error', message: String(error?.message || error) });
  }
};
