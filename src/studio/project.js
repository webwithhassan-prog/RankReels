import { useEffect, useReducer, useRef, useState } from 'react';
import { TIERS, formatById } from './formats.js';
import { MAX_CLIP_SECONDS } from './limits.js';
import { clipRecord, discardRestored, restoreFiles } from './restore.js';
import { keepFiles } from './storage.js';

export { MAX_CLIP_BYTES, MAX_CLIP_SECONDS, MIN_CLIP_SECONDS } from './limits.js';

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;
export const MAX_TITLE = 80;
const VOTE_LINE = 'Comment 1 or 2';
// A piece of a clip shorter than this is dropped: it would flash past in a frame or two.
const SHORTEST_PIECE = 0.05;

export const FONTS = [
  { id: 'Archivo Black', weight: 400 },
  { id: 'Anton', weight: 400 },
  { id: 'Bebas Neue', weight: 400 },
  { id: 'Montserrat', weight: 900 },
  { id: 'Poppins', weight: 800 },
];

export const HIGHLIGHT_COLORS = [
  { value: '#38BDF8', name: 'Sky blue' },
  { value: '#2DD4BF', name: 'Teal' },
  { value: '#FFD60A', name: 'Yellow' },
  { value: '#FB923C', name: 'Orange' },
  { value: '#F472B6', name: 'Pink' },
  { value: '#A3E635', name: 'Lime' },
];
export const TEXT_COLORS = [
  { value: '#FFFFFF', name: 'White' },
  { value: '#FFD60A', name: 'Yellow' },
  { value: '#0B0B0B', name: 'Black' },
];
export const OUTLINE_COLORS = [
  { value: '#000000', name: 'Black' },
  { value: '#FFFFFF', name: 'White' },
  { value: '#1E3A8A', name: 'Navy' },
  { value: '#7F1D1D', name: 'Dark red' },
];
export const BACKGROUND_COLORS = [
  { value: '#000000', name: 'Black' },
  { value: '#FFFFFF', name: 'White' },
  { value: '#0F172A', name: 'Midnight' },
  { value: '#14532D', name: 'Pitch green' },
];

export const DEFAULT_STYLE = {
  highlightColor: '#38BDF8',
  font: 'Archivo Black',
  titleSize: 88,
  strokeWidth: 8,
  strokeColor: '#000000',
  textColor: '#FFFFFF',
  showList: true,
  listSize: 44,
  showBadge: true,
  videoHeight: 62,
  fit: 'fill',
  background: '#000000',
  // Where the overlays sit, so they can be moved off anything important in the clip.
  listPosition: 'top',
  listPanel: false,
  badgePosition: 'top-right',
  // Fit mode: fills the empty bars with a blurred copy of the clip instead of the background color.
  blurBackground: true,
  // The clip covers the whole 9:16 frame and the title sits on top of it.
  fullFrame: false,
  // Full frame only: seconds the title stays up. 0 keeps it for the whole video.
  titleHold: 0,
  progressBar: false,
  footer: '',
  captionsOn: true,
  captionPreset: 'karaoke',
  captionSize: 76,
  captionWords: 3,
  captionHeight: 66,
  // Kept by channel presets for the on-video handle, opening and closing lines and clip entrance.
  watermark: '',
  introText: '',
  outroText: '',
  motion: 'none',
};

// One-click looks. Each only touches colors, font and outline, never layout.
export const LOOKS = [
  { id: 'night', name: 'Night', patch: { background: '#000000', textColor: '#FFFFFF', strokeColor: '#000000', strokeWidth: 8, highlightColor: '#38BDF8', font: 'Archivo Black' } },
  { id: 'broadcast', name: 'Broadcast', patch: { background: '#0F172A', textColor: '#FFFFFF', strokeColor: '#000000', strokeWidth: 8, highlightColor: '#FFD60A', font: 'Anton' } },
  { id: 'pitch', name: 'Pitch', patch: { background: '#14532D', textColor: '#FFFFFF', strokeColor: '#052E16', strokeWidth: 8, highlightColor: '#A3E635', font: 'Bebas Neue' } },
  { id: 'paper', name: 'Paper', patch: { background: '#FFFFFF', textColor: '#0B0B0B', strokeColor: '#FFFFFF', strokeWidth: 7, highlightColor: '#F43F5E', font: 'Montserrat' } },
  { id: 'pop', name: 'Pop', patch: { background: '#000000', textColor: '#FFD60A', strokeColor: '#000000', strokeWidth: 9, highlightColor: '#F472B6', font: 'Poppins' } },
];

export const CAPTION_PRESETS = [
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'clean', label: 'Clean' },
  { value: 'boxed', label: 'Boxed' },
  { value: 'minimal', label: 'Minimal' },
];

// Volumes run from 0 to 1. The voice and speed are the last ones used to make a voiceover.
// `sfx` is the optional sound played as each new clip starts, and `duck` lowers the music under the voice.
export const DEFAULT_AUDIO = {
  clipVolume: 1,
  trackVolume: 1,
  voice: 'af_heart',
  speed: 1,
  sfx: 'none',
  sfxVolume: 0.7,
  musicVolume: 0.5,
  duck: true,
};
export const MAX_SCRIPT = 5000;

// The clips an applied idea says to find, and the phrase to search for them. Empty until an idea is used.
const NO_PLAN = { items: [], search: '' };

const DRAFT_KEY = 'rankreel.draft';

export function fontWeight(fontId) {
  return FONTS.find((f) => f.id === fontId)?.weight ?? 400;
}

// Highlights follow the word, not its position, so they survive edits to the title.
export function wordKey(word) {
  const lower = word.toLowerCase();
  return lower.replace(/[^\p{L}\p{N}]+/gu, '') || lower;
}

export function titleWords(title) {
  return title.split(/\s+/).filter(Boolean);
}

// A ranking title reads best on two lines, so a second Enter becomes a space.
export function cleanTitle(value) {
  const [first, ...rest] = value.replace(/\r/g, '').split('\n');
  const text = rest.length ? `${first}\n${rest.join(' ')}` : first;
  return text.slice(0, MAX_TITLE);
}

// A countdown plays the list bottom-up so number 1 comes last. Every other format plays it top-down.
export function playbackOrder({ clips, customOrder, order, format }) {
  // In a this-or-that video only the first clip of each pair takes a turn; the second rides along.
  const paired = Boolean(formatById(format).pairs);
  const ids = clips.filter((_, i) => !paired || i % 2 === 0).map((c) => c.id);
  const countsDown = Boolean(formatById(format).countsDown);
  if (!customOrder) return countsDown ? [...ids].reverse() : ids;
  const known = order.filter((id) => ids.includes(id));
  const added = ids.filter((id) => !known.includes(id));
  return countsDown ? [...added.reverse(), ...known] : [...known, ...added];
}

function sameOrder(a, b) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function shuffle(ids) {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

// A countdown shuffle still ends on #1 and never falls back to a plain countdown.
// Other formats have no best clip to save for last, so everything is shuffled.
export function shuffledOrder(clips, current, keepBestLast) {
  const ids = clips.map((c) => c.id);
  const [best, ...rest] = ids;
  const pool = keepBestLast ? rest : ids;
  const tail = keepBestLast ? [best] : [];
  const plain = keepBestLast ? [...rest].reverse() : ids;
  if (pool.length < 2) return [...plain, ...tail];
  let candidate = plain;
  for (let attempt = 0; attempt < 24; attempt++) {
    const next = shuffle(pool);
    if (sameOrder(next, plain)) continue;
    candidate = next;
    if (!sameOrder([...next, ...tail], current)) break;
  }
  return [...candidate, ...tail];
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Tenths of a second, for trim handles where a whole second is too coarse.
export function formatPrecise(seconds) {
  const tenths = Math.max(0, Math.round(seconds * 10));
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
}

// The stretches of a clip that play, as { from, to } in seconds of the file: the trim, minus the
// parts cut out of the middle.
export function pieces(clip) {
  const kept = [];
  let from = clip.start;
  for (const cut of clip.cuts) {
    if (cut.to <= from || cut.from >= clip.end) continue;
    if (cut.from - from >= SHORTEST_PIECE) kept.push({ from, to: cut.from });
    from = cut.to;
  }
  if (clip.end - from >= SHORTEST_PIECE || !kept.length) kept.push({ from: Math.min(from, clip.end), to: clip.end });
  return kept;
}

// How long a clip plays once its trim and cuts are applied.
export function clipLength(clip) {
  // A slowed clip plays for longer than its stretch of the file, a sped-up one for less.
  return pieces(clip).reduce((sum, piece) => sum + piece.to - piece.from, 0) / (clip.speed || 1);
}

export function isTrimmed(clip) {
  return clip.start > 0.05 || clip.end < clip.duration - 0.05 || clip.cuts.length > 0;
}

// Where the end mark has to go for the clip to play for `seconds`, stepping over its cut-out parts.
// Never past the file's end or the longest stretch a clip may use.
export function endForLength(clip, seconds) {
  const limit = Math.min(clip.duration, clip.start + MAX_CLIP_SECONDS);
  let at = clip.start;
  let left = seconds * (clip.speed || 1);
  for (const cut of clip.cuts) {
    if (cut.to <= at) continue;
    const run = Math.max(0, cut.from - at);
    if (run >= left) break;
    left -= run;
    at = cut.to;
  }
  return Math.min(at + left, limit);
}

function move(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// A voiceover video fills the frame and only opens on its title. The numbered formats keep the title up.
function withFormat(state, format) {
  if (format === state.format) return state;
  const layout =
    format === 'story' ? { fullFrame: true, titleHold: 3 } : state.format === 'story' ? { fullFrame: false, titleHold: 0 } : {};
  // A this-or-that video asks for the vote, unless the line on the clip already says something.
  if (format === 'versus' && !state.style.footer) layout.footer = VOTE_LINE;
  if (state.format === 'versus' && state.style.footer === VOTE_LINE) layout.footer = '';
  // Switching format starts from the new format's own playing order.
  return { ...state, format, style: { ...state.style, ...layout }, customOrder: false, order: [] };
}

// Gives unnamed clips in `incoming` the next names from the idea's list that no clip is using yet.
function namedFromPlan(existing, incoming, plan, format) {
  const taken = new Set(existing.map((clip) => clip.name));
  const free = plan.items.map((name, at) => ({ name, at })).filter((item) => !taken.has(item.name));
  return incoming.map((clip) => {
    if (clip.name || !free.length) return clip;
    const { name, at } = free.shift();
    // A tier list idea puts its best item first, so the list position is a fair first guess at the tier.
    return format === 'tiers' ? { ...clip, name, tier: TIERS[Math.min(at, TIERS.length - 1)].id } : { ...clip, name };
  });
}

function reducer(state, action) {
  switch (action.type) {
    case 'title':
      return { ...state, title: cleanTitle(action.value) };
    case 'toggleHighlight': {
      const on = state.highlights.includes(action.key);
      return {
        ...state,
        highlights: on ? state.highlights.filter((k) => k !== action.key) : [...state.highlights, action.key],
      };
    }
    case 'titleIdea':
      return { ...state, title: cleanTitle(action.title), highlights: action.highlights };
    case 'style':
      return { ...state, style: { ...state.style, ...action.patch } };
    // One click sets up the format, the title and the list of clips to find.
    case 'applyIdea': {
      const { idea } = action;
      const next = withFormat(state, idea.format);
      const plan = { items: idea.items, search: idea.search };
      return {
        ...next,
        title: cleanTitle(idea.title),
        highlights: idea.highlights,
        plan,
        clips: namedFromPlan(next.clips, next.clips, plan, idea.format),
      };
    }
    case 'clearPlan':
      return { ...state, plan: NO_PLAN };
    case 'addClips':
      return { ...state, clips: [...state.clips, ...namedFromPlan(state.clips, action.clips, state.plan, state.format)] };
    case 'removeClip':
      return {
        ...state,
        clips: state.clips.filter((c) => c.id !== action.id),
        order: state.order.filter((id) => id !== action.id),
      };
    // Name, cut, framing, score and tier all live on the clip and change through here.
    case 'updateClip':
      return { ...state, clips: state.clips.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) };
    case 'insertClip': {
      const at = state.clips.findIndex((c) => c.id === action.after) + 1;
      return { ...state, clips: [...state.clips.slice(0, at), action.clip, ...state.clips.slice(at)] };
    }
    case 'format':
      return withFormat(state, action.format);
    case 'script':
      return { ...state, script: action.value.slice(0, MAX_SCRIPT) };
    case 'audio':
      return { ...state, audio: { ...state.audio, ...action.patch } };
    case 'track':
      return { ...state, track: action.track };
    case 'music':
      return { ...state, music: action.music };
    case 'moveClip':
      return { ...state, clips: move(state.clips, action.from, action.to) };
    case 'customOrder':
      return { ...state, customOrder: action.on, order: action.on ? playbackOrder(state) : state.order };
    case 'order':
      return { ...state, customOrder: true, order: action.order };
    // Last visit's clips and sound are back. Anything added while they loaded goes after them.
    case 'restored': {
      const { customOrder, order } = state.restore;
      const clips = [...action.clips, ...state.clips];
      const ids = clips.map((clip) => clip.id);
      return {
        ...state,
        clips,
        track: state.track ?? action.track,
        music: state.music ?? action.music,
        customOrder,
        order: order.filter((id) => ids.includes(id)),
        restore: null,
        lost: action.lost,
      };
    }
    // A channel preset brings its format, look and sound.
    case 'applyPreset': {
      const { preset } = action;
      const next = withFormat(state, preset.format);
      return { ...next, style: { ...next.style, ...preset.style }, audio: { ...next.audio, ...preset.audio }, channel: preset.id };
    }
    case 'channel':
      return { ...state, channel: action.id };
    case 'dismissLost':
      return { ...state, lost: 0 };
    // A new video keeps the look and the voice settings. The caller releases the clips and the sound first.
    case 'reset':
      return {
        ...blank(),
        channel: state.channel,
        style: { ...state.style, fullFrame: false, titleHold: 0, footer: '' },
        audio: { ...state.audio, clipVolume: 1 },
      };
    default:
      return state;
  }
}

function newVideoId() {
  return `video-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function blank() {
  return {
    // Tells saved videos apart, so putting one aside twice keeps one copy.
    id: newVideoId(),
    // The channel preset last applied, or null.
    channel: null,
    title: 'Ranking best\nfootball moments',
    highlights: ['football', 'moments'],
    style: DEFAULT_STYLE,
    format: 'countdown',
    script: '',
    audio: DEFAULT_AUDIO,
    plan: NO_PLAN,
    clips: [],
    // The voice, which captions follow, and the optional background music under it.
    track: null,
    music: null,
    customOrder: false,
    order: [],
    // Last visit's clips and sound, until they have been read back in: { clips, track, music, customOrder, order }.
    restore: null,
    // How many of them could not be brought back.
    lost: 0,
  };
}

// The clips and sound written down last visit, if there were any and they still look right.
function savedFiles(saved) {
  const clips = (Array.isArray(saved.clips) ? saved.clips : []).filter(
    (clip) => typeof clip?.id === 'string' && typeof clip.fileKey === 'string',
  );
  const sound = (record) =>
    typeof record?.fileKey === 'string'
      ? { fileKey: record.fileKey, words: Array.isArray(record.words) ? record.words : undefined }
      : null;
  const track = sound(saved.track);
  const music = sound(saved.music);
  if (!clips.length && !track && !music) return null;
  return {
    clips,
    track,
    music,
    customOrder: saved.customOrder === true,
    order: Array.isArray(saved.order) ? saved.order.filter((id) => typeof id === 'string') : [],
  };
}

function savedPlan(plan) {
  if (!Array.isArray(plan?.items)) return NO_PLAN;
  return { items: plan.items.filter((item) => typeof item === 'string'), search: typeof plan.search === 'string' ? plan.search : '' };
}

function loadDraft() {
  const base = blank();
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!saved) return base;
    return {
      ...base,
      title: typeof saved.title === 'string' ? cleanTitle(saved.title) : base.title,
      highlights: Array.isArray(saved.highlights) ? saved.highlights : base.highlights,
      style: { ...DEFAULT_STYLE, ...saved.style },
      format: formatById(saved.format).id,
      script: typeof saved.script === 'string' ? saved.script.slice(0, MAX_SCRIPT) : '',
      audio: { ...DEFAULT_AUDIO, ...saved.audio },
      plan: savedPlan(saved.plan),
      restore: savedFiles(saved),
      id: typeof saved.id === 'string' ? saved.id : base.id,
      channel: typeof saved.channel === 'string' ? saved.channel : null,
    };
  } catch {
    return base;
  }
}

function storageMessage(error) {
  return error?.name === 'QuotaExceededError'
    ? 'This browser is out of room to keep your clips, so they will be gone after a refresh. They work as normal until then.'
    : 'This browser is not letting the clips be saved, so they will be gone after a refresh. They work as normal until then.';
}

// The whole video is kept between visits: text and settings in the browser's small storage, and the
// clip and sound files in its database. Returns [project, dispatch, storageProblem].
export function useProject() {
  const [state, dispatch] = useReducer(reducer, undefined, loadDraft);
  const [storageProblem, setStorageProblem] = useState(null);
  const { id, channel, title, highlights, style, format, script, audio, plan, clips, track, music, customOrder, order, restore } = state;

  const restoreRef = useRef(restore);
  useEffect(() => {
    restoreRef.current = restore;
  }, [restore]);

  // Read last visit's files back in, once.
  useEffect(() => {
    const saved = restoreRef.current;
    if (!saved) return undefined;
    let live = true;
    restoreFiles(saved).then((restored) => {
      if (!live) return;
      // Starting a new video while the old one was still loading leaves nothing to restore into.
      if (restoreRef.current) dispatch({ type: 'restored', ...restored });
      else discardRestored(restored);
    });
    return () => {
      live = false;
    };
  }, []);

  // Until the old files are back, what was written down about them is kept as it was.
  useEffect(() => {
    const files = restore ?? {
      clips: clips.map(clipRecord),
      // The word timings from listening to the voice are kept, so it is not listened to again.
      track: track ? { fileKey: track.fileKey, words: track.words } : null,
      music: music ? { fileKey: music.fileKey } : null,
      customOrder,
      order,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ id, channel, title, highlights, style, format, script, audio, plan, ...files }));
    } catch {
      // Storage can be blocked or full; the editor works without it.
    }
  }, [id, channel, title, highlights, style, format, script, audio, plan, clips, track, music, customOrder, order, restore]);

  // The saved files follow the clips and sound in use. Only a change to which files those are does any work.
  const fileKeys = [...clips.map((clip) => clip.fileKey), track?.fileKey ?? '', music?.fileKey ?? ''].join('|');
  const filesRef = useRef({ clips, track, music });
  useEffect(() => {
    filesRef.current = { clips, track, music };
  }, [clips, track, music]);
  useEffect(() => {
    if (restore) return;
    const current = filesRef.current;
    const files = new Map(current.clips.map((clip) => [clip.fileKey, clip.file]));
    for (const sound of [current.track, current.music]) {
      if (sound) files.set(sound.fileKey, sound.file);
    }
    keepFiles(files).then(
      () => setStorageProblem(null),
      (error) => setStorageProblem(storageMessage(error)),
    );
  }, [fileKeys, restore]);

  return [state, dispatch, storageProblem];
}
