import { useRef } from 'react';
import { Download, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { frameInfo } from '../studio/drawFrame.js';
import { CANVAS_H, CANVAS_W, clipLength, formatTime } from '../studio/project.js';

const clamp = (value) => Math.max(-1, Math.min(1, value));

export default function Preview({ canvasRef, player, clips, order, total, onFrame }) {
  const drag = useRef(null);
  const count = order.length;
  const lengthOf = (id) => {
    const clip = clips.find((c) => c.id === id);
    return clip ? clipLength(clip) : 1;
  };
  const numberOf = (id) => clips.findIndex((c) => c.id === id) + 1;

  // Dragging the picture moves the clip that is showing. The pointer's travel is turned into the
  // clip's own position units using how much of the picture the last frame had out of view.
  const startDrag = (event) => {
    // The clip under the pointer: in a this-or-that pair, the upper or the lower one.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * CANVAS_W) / rect.width;
    const y = ((event.clientY - rect.top) * CANVAS_W) / rect.width;
    const region = frameInfo.regions.find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    const clip = clips.find((c) => c.id === (region?.clipId ?? order[player.index]));
    if (!clip) return;
    drag.current = {
      id: clip.id,
      x: event.clientX,
      y: event.clientY,
      panX: clip.panX,
      panY: clip.panY,
      scale: CANVAS_W / event.currentTarget.clientWidth,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const from = drag.current;
    const region = from && frameInfo.regions.find((r) => r.clipId === from.id);
    if (!region) return;
    const dx = (event.clientX - from.x) * from.scale;
    const dy = (event.clientY - from.y) * from.scale;
    const patch = {};
    if (region.overflowX > 1) patch.panX = clamp(from.panX - (2 * dx) / region.overflowX);
    if (region.overflowY > 1) patch.panY = clamp(from.panY - (2 * dy) / region.overflowY);
    if (Object.keys(patch).length) onFrame(from.id, patch);
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="stage">
      <canvas
        ref={canvasRef}
        className="screen"
        data-movable={count > 0}
        width={CANVAS_W}
        height={CANVAS_H}
        role="img"
        aria-label="Preview of the finished video. Drag the picture to move the clip inside its frame."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      <div className="transport">
        <button type="button" className="stage-btn" disabled={!count} aria-label="Previous clip" onClick={player.previous}>
          <SkipBack size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="stage-btn play"
          disabled={!count}
          aria-label={player.playing ? 'Pause' : 'Play'}
          onClick={player.playing ? player.pause : player.play}
        >
          {player.playing ? <Pause size={24} aria-hidden="true" /> : <Play size={24} aria-hidden="true" />}
        </button>
        <button type="button" className="stage-btn" disabled={player.index >= count - 1} aria-label="Next clip" onClick={player.next}>
          <SkipForward size={20} aria-hidden="true" />
        </button>
        <button type="button" className="stage-btn" aria-label={player.muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={player.muted} onClick={player.toggleMuted}>
          {player.muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
        </button>
      </div>

      {count > 0 && (
        <div className="segments">
          {order.map((id, i) => (
            <button
              key={id}
              type="button"
              className="segment"
              style={{ flexGrow: lengthOf(id) }}
              data-state={i < player.index ? 'played' : i === player.index ? 'current' : 'ahead'}
              aria-label={`Jump to clip ${numberOf(id)}`}
              aria-current={i === player.index}
              onClick={() => player.seek(i)}
            />
          ))}
        </div>
      )}

      <p className="clock">
        {count ? `Clip ${player.index + 1} of ${count}, ${formatTime(player.elapsed)} of ${formatTime(total)}` : 'No clips yet'}
      </p>

      <button type="button" className="btn btn-primary export" disabled={!count} onClick={player.startExport}>
        <Download size={20} aria-hidden="true" />
        Export video
      </button>
      <p className="stage-note">
        {count
          ? 'Renders in your browser at 1080 × 1920. Your clips never leave this device.'
          : 'Add a clip in step 3 to export.'}
      </p>
    </div>
  );
}
