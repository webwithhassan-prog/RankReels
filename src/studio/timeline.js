import { formatById, quizRevealAt } from './formats.js';
import { clipLength, pieces } from './project.js';

// How far the music drops while the voice is speaking, and how long it takes to fade at the end.
const DUCKED = 0.28;
const FADE_OUT_SECONDS = 1;
// The music dips a little before a word and stays down through short pauses, so it does not pump.
const SPEECH_WINDOW = 0.4;

// The video as a list of stretches, one per entry in the playing order: { clip, partner, start, length }.
// `partner` is the clip shown alongside in a this-or-that video, otherwise null.
export function rounds({ clips, order, format }) {
  const paired = Boolean(formatById(format).pairs);
  let start = 0;
  return order.flatMap((id) => {
    const at = clips.findIndex((clip) => clip.id === id);
    if (at < 0) return [];
    const round = { clip: clips[at], partner: paired ? clips[at + 1] ?? null : null, start, length: clipLength(clips[at]) };
    start += round.length;
    return [round];
  });
}

// Where in its file a clip is once it has played for `seconds`, stepping over the parts cut out.
// Past the end it stays on the last moment, which is what a clip that finished early shows.
export function fileTimeAt(clip, seconds) {
  const parts = pieces(clip);
  let left = Math.max(0, seconds) * (clip.speed || 1);
  for (const part of parts) {
    const length = part.to - part.from;
    if (left < length) return part.from + left;
    left -= length;
  }
  return parts[parts.length - 1].to;
}

// The moments the clip sound plays: when each clip after the first starts, or in Guess it, when
// each answer appears.
export function soundTimes(scene) {
  if (scene.format === 'quiz') return rounds(scene).map((round) => round.start + quizRevealAt(round.length));
  return rounds(scene).slice(1).map((round) => round.start);
}

function speaking(track, time) {
  const { spoken, step } = track.speech;
  const last = spoken.length - 1;
  const at = Math.round(time / step);
  const reach = Math.round(SPEECH_WINDOW / step);
  return spoken[Math.min(last, Math.max(0, at + reach))] - spoken[Math.min(last, Math.max(0, at - reach))] > 0;
}

// How loud the music is at a moment of the video, from 0 to 1 of its set volume: lower under the
// voice when that is switched on, and faded out over the last second.
export function musicLevel({ track, audio, total }, time) {
  const ducked = audio.duck && track && time < track.duration && speaking(track, time);
  const fade = Math.min(1, Math.max(0, (total - time) / FADE_OUT_SECONDS));
  return (ducked ? DUCKED : 1) * fade;
}
