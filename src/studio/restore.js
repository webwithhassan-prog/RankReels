import { disposeTrack, loadTrack } from './audioTrack.js';
import { disposeClip, loadClip, withSpare } from './clips.js';
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, SPEEDS } from './limits.js';
import { readFile } from './storage.js';

const number = (value, fallback) => (Number.isFinite(value) ? value : fallback);

// What is written down about a clip between visits. The file itself goes into the browser's database.
export function clipRecord(clip) {
  const { id, fileKey, name, start, end, cuts, zoom, panX, panY, speed, score, tier } = clip;
  return { id, fileKey, name, start, end, cuts, zoom, panX, panY, speed, score, tier };
}

// Saved settings are only trusted as far as they still fit the file.
function applyRecord(clip, record) {
  const start = Math.max(0, Math.min(number(record.start, 0), clip.duration - MIN_CLIP_SECONDS));
  const end = Math.min(clip.duration, Math.max(number(record.end, clip.end), start + MIN_CLIP_SECONDS), start + MAX_CLIP_SECONDS);
  const cuts = (Array.isArray(record.cuts) ? record.cuts : [])
    .filter((cut) => Number.isFinite(cut?.from) && Number.isFinite(cut?.to) && cut.from > start && cut.to < end && cut.to > cut.from)
    .map((cut) => ({ from: cut.from, to: cut.to }))
    .sort((a, b) => a.from - b.from);
  const restored = {
    ...clip,
    id: record.id,
    fileKey: record.fileKey,
    name: typeof record.name === 'string' ? record.name : '',
    start,
    end,
    cuts,
    zoom: Math.max(1, number(record.zoom, 1)),
    panX: number(record.panX, 0),
    panY: number(record.panY, 0),
    score: number(record.score, clip.score),
    tier: typeof record.tier === 'string' ? record.tier : clip.tier,
    speed: SPEEDS.includes(record.speed) ? record.speed : 1,
  };
  return cuts.length ? withSpare(restored) : restored;
}

async function bringBack(saved) {
  const files = new Map();
  // Two pieces of one video share a saved file, so each file is only read once.
  const fileFor = (key) => {
    if (!files.has(key)) files.set(key, readFile(key).catch(() => undefined));
    return files.get(key);
  };

  const clips = [];
  let lost = 0;
  for (const record of saved.clips) {
    const file = await fileFor(record.fileKey);
    try {
      if (!file) throw new Error('not saved');
      clips.push(applyRecord(await loadClip(file), record));
    } catch {
      lost++;
    }
  }

  const sounds = {};
  for (const kind of ['track', 'music']) {
    sounds[kind] = null;
    if (!saved[kind]) continue;
    const file = await fileFor(saved[kind].fileKey);
    try {
      if (!file) throw new Error('not saved');
      sounds[kind] = { ...(await loadTrack(file)), fileKey: saved[kind].fileKey, words: saved[kind].words };
    } catch {
      lost++;
    }
  }
  return { clips, ...sounds, lost };
}

let restoring;

// Reads last visit's clips and sound back in. Asking twice gives the same answer, not two copies.
export function restoreFiles(saved) {
  restoring ||= bringBack(saved);
  return restoring;
}

// For a restore that finished after the video was cleared.
export function discardRestored({ clips, track, music }) {
  clips.forEach(disposeClip);
  if (track) disposeTrack(track);
  if (music) disposeTrack(music);
}
