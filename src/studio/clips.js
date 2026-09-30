import { MAX_CLIP_BYTES, MAX_CLIP_SECONDS } from './limits.js';

const VIDEO_EXTENSION = /\.(mp4|mov|webm|m4v)$/i;
const POSTER_WIDTH = 720;
const THUMB_WIDTH = 96;

let nextId = 1;

// Clips are kept between visits, so an id has to stay unique across them, not just within one.
function newId(kind) {
  return `${kind}-${Date.now().toString(36)}-${nextId++}`;
}

function once(target, event, failMessage) {
  return new Promise((resolve, reject) => {
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error(failMessage));
    };
    const cleanup = () => {
      target.removeEventListener(event, done);
      target.removeEventListener('error', fail);
    };
    target.addEventListener(event, done);
    target.addEventListener('error', fail);
  });
}

// Recordings made in the browser report an infinite duration until they are seeked to the end.
async function measureDuration(video, failMessage) {
  video.currentTime = Number.MAX_SAFE_INTEGER;
  await once(video, 'seeked', failMessage);
  const duration = Number.isFinite(video.duration) ? video.duration : video.currentTime;
  video.currentTime = 0;
  await once(video, 'seeked', failMessage);
  return duration;
}

function snapshot(video, width) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(width, video.videoWidth);
  canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function player(url) {
  const video = document.createElement('video');
  video.preload = 'auto';
  video.playsInline = true;
  video.src = url;
  return video;
}

export function isVideoFile(file) {
  return file.type.startsWith('video/') || VIDEO_EXTENSION.test(file.name);
}

// Reads a local video file into a clip. Rejects with a message that completes "<file name> …".
export async function loadClip(file) {
  if (!isVideoFile(file)) throw new Error('is not a video. Add an MP4, MOV or WebM file.');
  if (file.size > MAX_CLIP_BYTES) {
    throw new Error(`is ${Math.round(file.size / 1024 / 1024)} MB. Clips can be up to 100 MB, so trim or compress it first.`);
  }

  const unreadable = 'could not be opened in this browser. Convert it to MP4 and add it again.';
  const url = URL.createObjectURL(file);
  const video = player(url);

  try {
    await once(video, 'loadeddata', unreadable);
    if (!video.videoWidth) throw new Error(unreadable);
    const duration = Number.isFinite(video.duration) ? video.duration : await measureDuration(video, unreadable);
    return {
      id: newId('clip'),
      name: '',
      fileName: file.name,
      url,
      video,
      // A second player, made once the clip has a part cut out. See withSpare.
      spare: null,
      duration,
      // Kept so the same file can be added again as a second piece, and saved for the next visit.
      file,
      // Two pieces of one file share this, so the file is only saved once.
      fileKey: newId('file'),
      // The trim. A file longer than the limit starts out cut to its opening stretch.
      start: 0,
      end: Math.min(duration, MAX_CLIP_SECONDS),
      // Parts removed from inside the trim, as { from, to } in seconds of the file, in order.
      cuts: [],
      // Framing inside the clip area: zoom is a multiplier, pan runs from -1 to 1 across the hidden part.
      zoom: 1,
      panX: 0,
      panY: 0,
      // How fast the clip plays: 0.5 is slow motion, 2 is double speed.
      speed: 1,
      // Only some formats show these.
      score: 8,
      tier: 'S',
      // Stands in for the picture when the video has no frame decoded yet.
      poster: snapshot(video, POSTER_WIDTH),
      thumb: snapshot(video, THUMB_WIDTH).toDataURL('image/jpeg', 0.7),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

// Jumping over a cut-out part on one player means a seek, which freezes the picture for a moment.
// With two players the next piece is already waiting on the other one, so the jump is instant.
export function withSpare(clip) {
  return clip.spare ? clip : { ...clip, spare: player(clip.url) };
}

// A second, independent piece of the same file, so two parts of one video can both be used.
export async function duplicateClip(clip) {
  const copy = await loadClip(clip.file);
  const { fileKey, name, start, end, cuts, zoom, panX, panY, speed, score, tier } = clip;
  const piece = { ...copy, fileKey, name, start, end, cuts, zoom, panX, panY, speed, score, tier };
  return cuts.length ? withSpare(piece) : piece;
}

function release(video) {
  video.pause();
  video.removeAttribute('src');
  video.load();
}

export function disposeClip(clip) {
  release(clip.video);
  if (clip.spare) release(clip.spare);
  URL.revokeObjectURL(clip.url);
}
