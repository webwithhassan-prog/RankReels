import { channelHandles } from './scores.js';

// What the "RankReel daily" n8n workflow (n8n/rankreel-daily.json) has made: once a day, whenever this computer
// is on, it writes 3 ideas per channel and saves a snapshot of every channel's views. Asking also hands it the
// channel handles from the presets, which the next snapshot uses.
const DAILY_URL = '/n8n/rankreel-daily';

let asked = null;

// { ideas: { date, channels: { presetId: [raw idea] } } | null, history: { date: { handle: { views, videos, perVideo } } } }
// Asked once per visit; null when n8n or the workflow is off.
export function fetchDaily() {
  asked ??= fetch(`${DAILY_URL}?handles=${encodeURIComponent(channelHandles().join(','))}`)
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
  return asked;
}

// The latest snapshot from before today, to show how much a channel has grown since.
export function earlierSnapshot(history) {
  const today = new Date().toLocaleDateString('en-CA');
  const date = Object.keys(history ?? {}).filter((day) => day < today).sort().pop();
  return date ? { date, channels: history[date] } : null;
}
