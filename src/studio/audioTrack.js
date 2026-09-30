const AUDIO_EXTENSION = /\.(mp3|wav|m4a|aac|ogg|oga|webm|flac)$/i;
const MAX_TRACK_BYTES = 50 * 1024 * 1024;
const SLICE_SECONDS = 0.02;
// A dip shorter than this inside a sentence is breath or a consonant, not a pause.
const SHORTEST_PAUSE_SLICES = 8;

let nextId = 1;

export function isAudioFile(file) {
  return file.type.startsWith('audio/') || AUDIO_EXTENSION.test(file.name);
}

// Works out which slices of the recording have a voice in them and returns the running total of
// spoken seconds. Captions are timed against this, so they wait through pauses instead of drifting.
function speechProfile(buffer) {
  const samples = buffer.getChannelData(0);
  const size = Math.max(1, Math.round(buffer.sampleRate * SLICE_SECONDS));
  const count = Math.floor(samples.length / size);
  const loudness = new Float32Array(count);
  for (let s = 0; s < count; s++) {
    let sum = 0;
    for (let i = s * size; i < (s + 1) * size; i++) sum += samples[i] * samples[i];
    loudness[s] = Math.sqrt(sum / size);
  }

  const sorted = Float32Array.from(loudness).sort();
  const threshold = (sorted[Math.floor(count * 0.95)] || 0) * 0.12;
  const voiced = Array.from(loudness, (level) => level > threshold);

  let quietFrom = -1;
  for (let s = 0; s <= count; s++) {
    if (s < count && !voiced[s]) {
      if (quietFrom < 0) quietFrom = s;
      continue;
    }
    const bridged = quietFrom > 0 && s < count && s - quietFrom < SHORTEST_PAUSE_SLICES;
    if (bridged) voiced.fill(true, quietFrom, s);
    quietFrom = -1;
  }

  const spoken = new Float32Array(count + 1);
  for (let s = 0; s < count; s++) spoken[s + 1] = spoken[s] + (voiced[s] ? SLICE_SECONDS : 0);
  return { step: SLICE_SECONDS, spoken };
}

// Reads a voiceover or music file. Rejects with a message that completes "<file name> …".
export async function loadTrack(file) {
  if (!isAudioFile(file)) throw new Error('is not a sound file. Add an MP3, WAV or M4A file.');
  if (file.size > MAX_TRACK_BYTES) {
    throw new Error(`is ${Math.round(file.size / 1024 / 1024)} MB. Sound files can be up to 50 MB.`);
  }

  let buffer;
  try {
    buffer = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error('could not be opened in this browser. Convert it to MP3 and add it again.');
  }

  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  audio.preload = 'auto';
  const id = `track-${Date.now().toString(36)}-${nextId++}`;
  return {
    id,
    fileName: file.name,
    // The file is saved under this key for the next visit.
    file,
    fileKey: id,
    url,
    audio,
    duration: buffer.duration,
    speech: speechProfile(buffer),
  };
}

export function disposeTrack(track) {
  track.audio.pause();
  track.audio.removeAttribute('src');
  track.audio.load();
  URL.revokeObjectURL(track.url);
}

// Records from the microphone until stop() is called, then hands back the take as a file.
export async function recordVoice() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const finished = new Promise((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = (recorder.mimeType || 'audio/webm').split(';')[0];
      resolve(new File(chunks, `My voice.${type.includes('mp4') ? 'm4a' : 'webm'}`, { type }));
    };
  });
  recorder.start();
  return {
    stop() {
      if (recorder.state !== 'inactive') recorder.stop();
      return finished;
    },
  };
}
