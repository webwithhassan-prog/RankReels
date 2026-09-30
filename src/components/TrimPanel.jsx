import { Play, Scissors } from 'lucide-react';
import { withSpare } from '../studio/clips.js';
import { MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, clipLength, formatPrecise, pieces } from '../studio/project.js';

const STEP = 0.1;
// The end handle shows the last frame that stays in, which sits just before the end mark.
const LAST_FRAME = 0.05;
// What has to stay between two cut-out parts, and between one and either end of the clip.
const GAP = 0.3;
const SHORTEST_CUT = 0.2;
const MAX_CUTS = 4;
// A new cut-out part needs a stretch at least this long to sit in.
const ROOM_FOR_CUT = 1.5;
// How much plays before a cut-out part when it is previewed.
const LEAD_IN = 1.5;

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const tenth = (value) => Math.round(value * 10) / 10;

// Two handles on one track set where the clip starts and ends. Below them, each part cut out of the
// middle has its own pair of handles on the same scale.
export default function TrimPanel({ clip, rank, dispatch, onScrub, onPreview }) {
  const { id, duration, start, end, cuts } = clip;
  const tooLong = duration > MAX_CLIP_SECONDS + 0.05;
  const fullEnd = Math.min(duration, MAX_CLIP_SECONDS);
  const uncut = start < 0.05 && Math.abs(end - fullEnd) < 0.05 && cuts.length === 0;

  const update = (patch) => dispatch({ type: 'updateClip', id, patch });

  // A cut-out part that a trim handle reaches is dropped: past the handle there is nothing left to cut.
  const trim = (nextStart, nextEnd) =>
    update({
      start: nextStart,
      end: nextEnd,
      cuts: cuts.filter((cut) => cut.from >= nextStart + GAP && cut.to <= nextEnd - GAP),
    });

  // Dragging one handle past the longest allowed cut pulls the other handle along.
  const moveStart = (value) => {
    const nextStart = Math.max(0, Math.min(value, end - MIN_CLIP_SECONDS));
    trim(nextStart, Math.min(end, nextStart + MAX_CLIP_SECONDS));
    onScrub(id, nextStart);
  };

  const moveEnd = (value) => {
    const nextEnd = Math.min(duration, Math.max(value, start + MIN_CLIP_SECONDS));
    trim(Math.max(start, nextEnd - MAX_CLIP_SECONDS), nextEnd);
    onScrub(id, Math.max(0, nextEnd - LAST_FRAME));
  };

  const reset = () => {
    update({ start: 0, end: fullEnd, cuts: [] });
    onScrub(id, 0);
  };

  // A new cut-out part starts in the middle of the longest stretch that still plays.
  const longest = pieces(clip).reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a));
  const canCut = cuts.length < MAX_CUTS && longest.to - longest.from >= ROOM_FOR_CUT;

  const addCut = () => {
    const length = Math.min(2, (longest.to - longest.from) / 3);
    const middle = (longest.from + longest.to) / 2;
    const cut = { from: tenth(middle - length / 2), to: tenth(middle + length / 2) };
    // The second player is what lets playback jump the gap without freezing.
    update({ cuts: [...cuts, cut].sort((a, b) => a.from - b.from), spare: withSpare(clip).spare });
    onScrub(id, cut.from);
  };

  // A cut-out part cannot run into its neighbours or the ends of the clip.
  const moveCut = (i, edge, value) => {
    const cut = cuts[i];
    const low = (i > 0 ? cuts[i - 1].to : start) + GAP;
    const high = (i < cuts.length - 1 ? cuts[i + 1].from : end) - GAP;
    const next =
      edge === 'from'
        ? { from: clamp(value, low, cut.to - SHORTEST_CUT), to: cut.to }
        : { from: cut.from, to: clamp(value, cut.from + SHORTEST_CUT, high) };
    update({ cuts: cuts.map((c, n) => (n === i ? next : c)) });
    // Shows the last frame before the gap, or the first one after it.
    onScrub(id, edge === 'from' ? Math.max(start, next.from - LAST_FRAME) : next.to);
  };

  const removeCut = (i) => {
    update({ cuts: cuts.filter((_, n) => n !== i) });
    onScrub(id, cuts[i].from);
  };

  return (
    <div className="trim" id={`trim-${id}`}>
      <div className="trim-track" style={{ '--from': start / duration, '--to': end / duration }}>
        <span className="trim-kept" aria-hidden="true" />
        {cuts.map((cut, i) => (
          <span key={i} className="trim-gap" style={{ '--from': cut.from / duration, '--to': cut.to / duration }} aria-hidden="true" />
        ))}
        <input
          type="range"
          min={0}
          max={duration}
          step={STEP}
          value={start}
          // Whichever handle could get stuck underneath the other goes on top.
          style={{ zIndex: start > duration / 2 ? 2 : 1 }}
          aria-label={`Where clip ${rank} starts`}
          aria-valuetext={formatPrecise(start)}
          onChange={(e) => moveStart(Number(e.target.value))}
        />
        <input
          type="range"
          min={0}
          max={duration}
          step={STEP}
          value={end}
          style={{ zIndex: start > duration / 2 ? 1 : 2 }}
          aria-label={`Where clip ${rank} ends`}
          aria-valuetext={formatPrecise(end)}
          onChange={(e) => moveEnd(Number(e.target.value))}
        />
      </div>
      <p className="trim-readout">
        <span>
          Plays from <b>{formatPrecise(start)}</b> to <b>{formatPrecise(end)}</b>
          {cuts.length > 0 && ` with ${cuts.length === 1 ? 'one part' : `${cuts.length} parts`} cut out`}, {formatPrecise(clipLength(clip))} long.
          {tooLong && ` A clip can play for up to ${MAX_CLIP_SECONDS} seconds.`}
        </span>
        <button type="button" className="link-btn" disabled={uncut} onClick={reset}>
          {cuts.length > 0 ? 'Undo every cut' : 'Undo the cut'}
        </button>
      </p>

      {cuts.map((cut, i) => (
        <div key={i} className="cut">
          <div className="trim-track cut-track" style={{ '--from': cut.from / duration, '--to': cut.to / duration }}>
            <span className="trim-kept" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={duration}
              step={STEP}
              value={cut.from}
              style={{ zIndex: cut.from > duration / 2 ? 2 : 1 }}
              aria-label={`Where cut-out part ${i + 1} of clip ${rank} starts`}
              aria-valuetext={formatPrecise(cut.from)}
              onChange={(e) => moveCut(i, 'from', Number(e.target.value))}
            />
            <input
              type="range"
              min={0}
              max={duration}
              step={STEP}
              value={cut.to}
              style={{ zIndex: cut.from > duration / 2 ? 1 : 2 }}
              aria-label={`Where cut-out part ${i + 1} of clip ${rank} ends`}
              aria-valuetext={formatPrecise(cut.to)}
              onChange={(e) => moveCut(i, 'to', Number(e.target.value))}
            />
          </div>
          <p className="trim-readout">
            <span>
              Takes out <b>{formatPrecise(cut.from)}</b> to <b>{formatPrecise(cut.to)}</b>, {formatPrecise(cut.to - cut.from)} gone.
            </span>
            <span className="panel-actions">
              <button type="button" className="link-btn" onClick={() => onPreview(id, Math.max(start, cut.from - LEAD_IN))}>
                <Play size={14} aria-hidden="true" /> Play the jump
              </button>
              <button type="button" className="link-btn" onClick={() => removeCut(i)}>
                Put it back
              </button>
            </span>
          </p>
        </div>
      ))}

      <p className="trim-readout">
        <button type="button" className="link-btn" disabled={!canCut} onClick={addCut}>
          <Scissors size={14} aria-hidden="true" /> Cut a part out of the middle
        </button>
        {cuts.length > 0 && <span>The arrow keys move a handle a tenth of a second.</span>}
      </p>
    </div>
  );
}
