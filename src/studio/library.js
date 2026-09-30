import { keepAlso, syncFiles } from './storage.js';

// Videos put aside with "New video", kept whole so they can be opened again later. The open video
// always lives in the draft; the others live here. Their files stay in the browser's database.
const LIBRARY_KEY = 'rankreel.library';
const DRAFT_KEY = 'rankreel.draft';

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function readList() {
  const list = read(LIBRARY_KEY, []);
  return Array.isArray(list) ? list : [];
}

function writeList(list) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
  } catch {
    // A full store keeps the list as it was.
  }
}

function fileKeysOf(draft) {
  return [...(draft?.clips ?? []).map((clip) => clip.fileKey), draft?.track?.fileKey, draft?.music?.fileKey].filter(Boolean);
}

// Every file a saved video or the open one still needs, so none of them is cleared from the database.
function keysInUse() {
  return new Set([...readList().flatMap((video) => fileKeysOf(video.draft)), ...fileKeysOf(read(DRAFT_KEY, null))]);
}
keepAlso(keysInUse);

function hasWork(draft) {
  return Boolean(draft && (draft.clips?.length || draft.track || draft.music || draft.script?.trim()));
}

export function listVideos() {
  return readList().sort((a, b) => b.savedAt - a.savedAt);
}

// Puts the open video on the list, replacing an older copy of the same video.
export function stashCurrent() {
  const draft = read(DRAFT_KEY, null);
  if (!hasWork(draft) || !draft.id) return;
  writeList([...readList().filter((video) => video.id !== draft.id), { id: draft.id, savedAt: Date.now(), draft }]);
}

// Swaps the open video for a saved one. The page reloads to read the saved video's files back in.
export function openVideo(id) {
  stashCurrent();
  const list = readList();
  const video = list.find((item) => item.id === id);
  if (!video) return;
  writeList(list.filter((item) => item.id !== id));
  localStorage.setItem(DRAFT_KEY, JSON.stringify(video.draft));
  location.reload();
}

export function deleteVideo(id) {
  writeList(readList().filter((video) => video.id !== id));
  syncFiles();
}
