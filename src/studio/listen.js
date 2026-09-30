// Times captions from the voice itself. A small speech recogniser runs in the browser and reports
// when each word is said; the script's own words are then laid over those moments.
const LISTENING_RATE = 16000;
// Below this share of script words found in the recording, the script is taken to be about something else.
const ENOUGH_MATCHED = 0.4;

let worker;
let nextJob = 1;

const plain = (word) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

async function monoSamples(file) {
  // Decoding in a context at the recogniser's rate resamples the sound on the way in.
  const buffer = await new OfflineAudioContext(1, 1, LISTENING_RATE).decodeAudioData(await file.arrayBuffer());
  const samples = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) samples[i] += data[i] / buffer.numberOfChannels;
  }
  return samples;
}

// Resolves with the words heard in the file as [{ text, start, end }], in seconds.
// `onProgress` gets { phase: 'download', fraction } then { phase: 'listening' }.
export async function hearWords(file, onProgress) {
  const samples = await monoSamples(file);
  worker ||= new Worker(new URL('./listen.worker.js', import.meta.url), { type: 'module' });
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
      reject(new Error('The listening model stopped unexpectedly. Reload the page and try again.'));
    };
    const onMessage = ({ data }) => {
      if (data.id !== id) return;
      if (data.type === 'download') onProgress({ phase: 'download', fraction: data.total ? data.loaded / data.total : 0 });
      if (data.type === 'listening') onProgress({ phase: 'listening' });
      if (data.type === 'error') {
        stop();
        reject(new Error(data.message));
      }
      if (data.type === 'done') {
        stop();
        resolve(data.words);
      }
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({ id, samples }, [samples.buffer]);
  });
}

// Pairs up the script's words with the heard words, keeping both in order. Returns, for each script
// word, the index of the heard word it matches or -1. This is the longest run of matches there is.
function matchWords(wanted, heard) {
  const rows = wanted.length + 1;
  const columns = heard.length + 1;
  const best = new Uint16Array(rows * columns);
  for (let i = wanted.length - 1; i >= 0; i--) {
    for (let j = heard.length - 1; j >= 0; j--) {
      best[i * columns + j] =
        wanted[i] && wanted[i] === heard[j]
          ? best[(i + 1) * columns + j + 1] + 1
          : Math.max(best[(i + 1) * columns + j], best[i * columns + j + 1]);
    }
  }
  const matches = new Array(wanted.length).fill(-1);
  let i = 0;
  let j = 0;
  while (i < wanted.length && j < heard.length) {
    if (wanted[i] && wanted[i] === heard[j]) matches[i++] = j++;
    else if (best[(i + 1) * columns + j] >= best[i * columns + j + 1]) i++;
    else j++;
  }
  return matches;
}

// Gives the script's words the times at which they were heard. A word the recogniser missed or got
// wrong shares out the gap between its matched neighbours. Returns null when too little matches.
export function alignWords(scriptWords, heard, duration) {
  const matches = matchWords(scriptWords.map(plain), heard.map((word) => plain(word.text)));
  const matched = matches.filter((at) => at >= 0).length;
  if (matched < scriptWords.length * ENOUGH_MATCHED) return null;

  const timed = scriptWords.map((text, i) => (matches[i] >= 0 ? { text, start: heard[matches[i]].start, end: heard[matches[i]].end } : null));
  for (let i = 0; i < timed.length; i++) {
    if (timed[i]) continue;
    let last = i;
    while (last + 1 < timed.length && !timed[last + 1]) last++;
    const from = i > 0 ? timed[i - 1].end : heard[0].start;
    const to = last + 1 < timed.length ? timed[last + 1].start : Math.min(duration, heard[heard.length - 1].end);
    const weights = scriptWords.slice(i, last + 1).map((word) => plain(word).length + 1);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let before = 0;
    for (let k = i; k <= last; k++) {
      const start = from + (Math.max(0, to - from) * before) / total;
      before += weights[k - i];
      timed[k] = { text: scriptWords[k], start, end: from + (Math.max(0, to - from) * before) / total };
    }
    i = last;
  }
  return timed;
}
