import { loadPresets } from './presets.js';

// How each channel's latest videos are doing, read through the n8n workflow in
// n8n/rankreel-channel-scores.json. It uses only the channels' public YouTube feeds: no login and no key.
const SCORES_URL = '/n8n/rankreel-scores';
const HANDLE = /^@[\w.-]{3,30}$/;

// The channels to check are the handles set in the channel presets, so a new channel joins the table
// once its preset has its handle.
export function channelHandles() {
  const handles = loadPresets().map((preset) => (preset.style?.watermark ?? '').trim());
  return [...new Set(handles.filter((handle) => HANDLE.test(handle)))];
}

// The channels, best first by views per video. Channels with nothing to count go last.
export async function fetchScores(handles, signal) {
  let response;
  try {
    response = await fetch(`${SCORES_URL}?handles=${encodeURIComponent(handles.join(','))}`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('n8n is not answering. Start it and try again.');
  }
  const reply = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(reply?.channels)) {
    throw new Error('The scores did not come back. Check that the RankReel channel scores workflow is published in n8n.');
  }
  return reply.channels
    .map((channel) => ({ ...channel, best: channel.videos.reduce((top, video) => (!top || video.views > top.views ? video : top), null) }))
    .sort((a, b) => b.perVideo - a.perVideo || b.videos.length - a.videos.length);
}

const COUNT = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export function countOf(number) {
  return COUNT.format(number);
}
