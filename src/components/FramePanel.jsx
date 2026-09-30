import { SPEEDS } from '../studio/limits.js';
import { Select, Slider } from './controls.jsx';

const SPEED_OPTIONS = SPEEDS.map((speed) => ({
  value: String(speed),
  label: speed < 1 ? `${speed}× slow motion` : speed === 1 ? 'Normal speed' : `${speed}× faster`,
}));

// Zoom and position of one clip inside the clip area, for keeping the subject in shot and the
// overlays off anything that matters. The same values change when the preview is dragged.
export default function FramePanel({ clip, rank, dispatch, onScrub, onAddAgain }) {
  const set = (patch) => {
    dispatch({ type: 'updateClip', id: clip.id, patch });
    // Bring this clip up in the preview so the change is visible.
    onScrub(clip.id, clip.video.currentTime >= clip.start && clip.video.currentTime < clip.end ? clip.video.currentTime : clip.start);
  };
  const untouched = clip.zoom === 1 && clip.panX === 0 && clip.panY === 0;

  return (
    <div className="frame-panel">
      <p className="panel-title">Framing for clip {rank}</p>
      <div className="frame-sliders">
        <Slider label="Zoom" value={Math.round(clip.zoom * 100)} min={100} max={300} unit="%" onChange={(value) => set({ zoom: value / 100 })} />
        <Slider label="Left to right" value={Math.round(clip.panX * 100)} min={-100} max={100} unit="" onChange={(value) => set({ panX: value / 100 })} />
        <Slider label="Up to down" value={Math.round(clip.panY * 100)} min={-100} max={100} unit="" onChange={(value) => set({ panY: value / 100 })} />
      </div>
      <Select
        label="Speed"
        options={SPEED_OPTIONS}
        value={String(clip.speed || 1)}
        onChange={(value) => dispatch({ type: 'updateClip', id: clip.id, patch: { speed: Number(value) } })}
      />
      <p className="trim-readout">
        <span>You can also drag the picture in the preview. Zoom in first if there is nothing to move.</span>
        <span className="panel-actions">
          <button type="button" className="link-btn" disabled={untouched} onClick={() => set({ zoom: 1, panX: 0, panY: 0 })}>
            Reset the framing
          </button>
          <button type="button" className="link-btn" onClick={onAddAgain}>
            Add this file again
          </button>
        </span>
      </p>
    </div>
  );
}
