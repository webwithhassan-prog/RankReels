import { alignWords } from './listen.js';

const SENTENCE_END = /[.!?…]["')\]]*$/;
// A caption stays up through a short pause, then clears so it is not left hanging over silence.
const LINGER_SECONDS = 1;

// First moment at which this many seconds have been spoken.
function momentAt(speech, spokenSeconds) {
  const { spoken, step } = speech;
  let low = 0;
  let high = spoken.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (spoken[mid] < spokenSeconds) low = mid + 1;
    else high = mid;
  }
  return low * step;
}

// Gives every word of the script a start and end time. When the voice has been listened to
// (track.words), the script's words take the moments they were actually heard, and with no script the
// heard words are the captions. Otherwise the words are spread over the moments the voice is sounding,
// longer words getting more time, which holds up for a steady read but is only an estimate.
export function timeWords(script, track) {
  const words = script.split(/\s+/).filter(Boolean);
  if (!track) return [];
  if (track.words?.length) {
    // A script that does not match the recording is ignored in favour of what was heard.
    const heard = (words.length && alignWords(words, track.words, track.duration)) || track.words;
    return heard.map((word) => ({ ...word, endsSentence: SENTENCE_END.test(word.text) }));
  }
  if (!words.length) return [];

  const weights = words.map((word) => (word.replace(/[^\p{L}\p{N}]/gu, '').length || 1) + 1);
  const total = weights.reduce((sum, w) => sum + w, 0);
  const spokenTotal = track.speech.spoken[track.speech.spoken.length - 1];
  const moment =
    spokenTotal > 1
      ? (fraction) => momentAt(track.speech, fraction * spokenTotal)
      : (fraction) => fraction * track.duration;

  let before = 0;
  return words.map((text, i) => {
    const start = moment(before / total);
    before += weights[i];
    return { text, start, end: moment(before / total), endsSentence: SENTENCE_END.test(text) };
  });
}

// Groups the timed words into the short lines that show one at a time. A sentence never runs into the next.
export function captionLines(words, perLine) {
  const lines = [];
  let line = [];
  for (const word of words) {
    line.push(word);
    if (line.length >= perLine || word.endsSentence) {
      lines.push(line);
      line = [];
    }
  }
  if (line.length) lines.push(line);
  return lines.map((group) => ({ words: group, start: group[0].start, end: group[group.length - 1].end }));
}

export function captionAt(lines, time) {
  let current = null;
  for (const line of lines) {
    if (line.start > time) break;
    current = line;
  }
  return current && time < current.end + LINGER_SECONDS ? current : null;
}
