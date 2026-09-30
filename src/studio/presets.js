// A channel preset keeps one channel's look, format and sound, so switching channels is one click.
const PRESETS_KEY = 'rankreel.presets';

const PLAIN = { textColor: '#FFFFFF', strokeColor: '#000000', strokeWidth: 8 };

// The five channels planned for the niche test. Handles are left empty until the channel exists,
// except for the one already running.
export const DEFAULT_PRESETS = [
  {
    id: 'rank-the-play',
    name: 'Rank The Play',
    format: 'countdown',
    style: { ...PLAIN, background: '#111827', highlightColor: '#FB923C', font: 'Anton', watermark: '@MetaRank_39', introText: 'Wait for number 1', outroText: 'Follow for part 2', motion: 'punch' },
    audio: { sfx: 'whoosh' },
  },
  {
    id: 'wait-really',
    name: 'Wait, Really?',
    format: 'story',
    style: { ...PLAIN, background: '#0F172A', highlightColor: '#FFD60A', font: 'Archivo Black', watermark: '', introText: '', outroText: 'Follow for more facts', motion: 'punch' },
    audio: { sfx: 'none' },
  },
  {
    id: 'tech-tier',
    name: 'Tech Tier',
    format: 'tiers',
    style: { ...PLAIN, background: '#0B0B0B', highlightColor: '#38BDF8', font: 'Montserrat', watermark: '', introText: '', outroText: 'Comment what to rank next', motion: 'swipe' },
    audio: { sfx: 'pop' },
  },
  {
    id: 'money-levels',
    name: 'Money Levels',
    format: 'levels',
    style: { ...PLAIN, background: '#052E16', highlightColor: '#A3E635', font: 'Bebas Neue', watermark: '', introText: 'Which level are you?', outroText: 'Follow to level up', motion: 'punch' },
    audio: { sfx: 'ding' },
  },
  {
    id: 'guess-the-scene',
    name: 'Guess The Scene',
    format: 'quiz',
    style: { ...PLAIN, background: '#1A0B14', highlightColor: '#F472B6', font: 'Poppins', watermark: '', introText: 'Count your score', outroText: 'Comment your score', motion: 'none' },
    audio: { sfx: 'ding' },
  },
];

const AUDIO_KEYS = ['clipVolume', 'trackVolume', 'voice', 'speed', 'sfx', 'sfxVolume', 'musicVolume', 'duck'];

export function loadPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRESETS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // Unreadable storage falls back to the starting set.
  }
  return DEFAULT_PRESETS;
}

export function savePresets(list) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  } catch {
    // Storage can be blocked; the presets then last for this visit.
  }
}

// Everything about the look and sound of the open video, as a preset.
export function presetFrom(project, id, name) {
  return {
    id,
    name,
    format: project.format,
    style: project.style,
    audio: Object.fromEntries(AUDIO_KEYS.map((key) => [key, project.audio[key]])),
  };
}
