import { useRef, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { earlierSnapshot, fetchDaily } from '../studio/daily.js';
import { channelHandles, countOf, fetchScores } from '../studio/scores.js';

function sinceOf(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// `earlier` is n8n's last daily snapshot from before today, when there is one.
function detailOf(channel, earlier) {
  if (!channel.found) return 'Could not find this channel. Check the handle in its preset.';
  if (!channel.videos.length) return 'No public videos yet';
  const count = `${channel.videos.length} video${channel.videos.length === 1 ? '' : 's'}`;
  const then = earlier?.channels[channel.handle];
  const growth = then ? `, +${countOf(Math.max(0, channel.views - then.views))} views since ${sinceOf(earlier.date)}` : '';
  return `${count}${growth}, best: ${channel.best.title} (${countOf(channel.best.views)})`;
}

// Which niche is winning: views per video for each channel in the presets, fetched when the list opens.
export default function ChannelScores() {
  const [state, setState] = useState({ phase: 'idle', channels: [], problem: null });
  const run = useRef(null);

  const load = async () => {
    const handles = channelHandles();
    if (!handles.length) {
      setState({ phase: 'done', channels: [], problem: null });
      return;
    }
    run.current?.abort();
    const control = new AbortController();
    run.current = control;
    setState((current) => ({ ...current, phase: 'loading', problem: null }));
    try {
      const [channels, daily] = await Promise.all([fetchScores(handles, control.signal), fetchDaily()]);
      setState({ phase: 'done', channels, earlier: earlierSnapshot(daily?.history), problem: null });
    } catch (error) {
      if (error.name !== 'AbortError') setState({ phase: 'done', channels: [], problem: error.message });
    }
  };

  return (
    <details className="library-list" onToggle={(event) => event.currentTarget.open && state.phase === 'idle' && load()}>
      <summary className="btn">
        <BarChart3 size={18} aria-hidden="true" />
        Channel scores
      </summary>
      <div className="library-panel scores-panel">
        {state.phase === 'loading' && <p className="status" role="status">Reading your channels…</p>}
        {state.problem && <p className="notice" role="alert">{state.problem}</p>}
        {state.phase === 'done' && !state.problem && state.channels.length === 0 && (
          <p className="field-note">
            No channel has a handle yet. Pick a channel above, fill in “Your @handle on the video” in step 5, and
            save the channel.
          </p>
        )}
        {state.channels.length > 0 && (
          <ul>
            {state.channels.map((channel) => (
              <li key={channel.handle}>
                <span>
                  <strong>{channel.name}</strong>
                  <small>{detailOf(channel, state.earlier)}</small>
                </span>
                <span className="score">
                  <strong>{countOf(channel.perVideo)}</strong>
                  <small>views per video</small>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="field-note">
          From each channel’s public YouTube feed, which lists its latest 15 videos. Channels come from the handles in
          your channel presets.
        </p>
        <button type="button" className="btn" disabled={state.phase === 'loading'} onClick={load}>
          <RefreshCw size={16} aria-hidden="true" />
          Check again
        </button>
      </div>
    </details>
  );
}
