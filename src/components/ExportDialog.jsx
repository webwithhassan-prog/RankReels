import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';

function fileName(title, extension) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'rankreel'}.${extension}`;
}

export default function ExportDialog({ state, title, onCancel, onClose }) {
  const ref = useRef(null);
  const open = state.status !== 'idle';

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const dismiss = state.status === 'rendering' ? onCancel : onClose;
  const percent = Math.round((state.progress ?? 0) * 100);

  return (
    <dialog
      ref={ref}
      className="export-dialog"
      aria-labelledby="export-heading"
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
    >
      {state.status === 'rendering' && (
        <>
          <h2 id="export-heading">Rendering your video</h2>
          <p>
            {state.fast
              ? 'Building the video on this computer, faster than it plays. You can switch tabs while it works.'
              : 'The video plays through once while it records. Keep this tab in view. If you switch away, rendering pauses until you come back.'}
          </p>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Rendering progress">
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="progress-value">{percent}%</p>
          <button type="button" className="btn" onClick={onCancel}>Cancel rendering</button>
        </>
      )}

      {state.status === 'ready' && (
        <>
          <h2 id="export-heading">Your video is ready</h2>
          <p>
            {(state.size / 1024 / 1024).toFixed(1)} MB {state.extension.toUpperCase()}, 1080 × 1920.
            {state.extension === 'webm' &&
              ' This browser records WebM, which YouTube accepts. For an MP4, export from Chrome or Edge.'}
          </p>
          <a className="btn btn-primary" href={state.url} download={fileName(title, state.extension)}>
            <Download size={20} aria-hidden="true" />
            Download video
          </a>
          <button type="button" className="btn" onClick={onClose}>Back to editing</button>
        </>
      )}

      {state.status === 'error' && (
        <>
          <h2 id="export-heading">The video was not exported</h2>
          <p>{state.message}</p>
          <button type="button" className="btn" onClick={onClose}>Back to editing</button>
        </>
      )}
    </dialog>
  );
}
