import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, GripVertical, Scissors, Upload, X } from 'lucide-react';
import { disposeClip, duplicateClip, isVideoFile, loadClip } from '../studio/clips.js';
import { TIERS, formatById, pairLabel } from '../studio/formats.js';
import { MAX_CLIP_SECONDS, clipLength, formatTime, isTrimmed } from '../studio/project.js';
import { StepHeading } from './controls.jsx';
import FramePanel from './FramePanel.jsx';
import TrimPanel from './TrimPanel.jsx';

const SHORTS_LIMIT_SECONDS = 180;

function countAdvice(count, format) {
  if (count === 0) return null;
  const clips = count === 1 ? '1 clip' : `${count} clips`;
  if (format === 'story') return `${clips}.`;
  if (format === 'versus') {
    const pairs = Math.floor(count / 2);
    const pairText = pairs === 1 ? '1 pair' : `${pairs} pairs`;
    return count % 2 ? `${pairText} and one clip on its own. Add one more to finish the pair.` : `${pairText}.`;
  }
  if (count < 5) return `${clips} so far. These videos hold viewers best with 5 to 7.`;
  if (count <= 7) return `${clips}, right in the 5 to 7 range that holds viewers best.`;
  return `${clips}. Viewers tend to leave before the end once a video passes 7.`;
}

function isReframed(clip) {
  return clip.zoom !== 1 || clip.panX !== 0 || clip.panY !== 0;
}

function tiktokSearch(text) {
  return `https://www.tiktok.com/search?q=${encodeURIComponent(text)}`;
}

export default function ClipsStep({ clips, format, plan, total, restoring, lost, storageProblem, dispatch, onScrub, onPreview }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState([]);
  const [filesOver, setFilesOver] = useState(false);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [panelOpen, setPanelOpen] = useState([]);
  const fmt = formatById(format);

  const addFiles = useCallback(
    async (fileList) => {
      const files = [...fileList].filter((file) => !file.type.startsWith('audio/'));
      if (!files.length) return;
      setLoading(true);
      const results = await Promise.allSettled(files.map(loadClip));
      const loaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      if (loaded.length) dispatch({ type: 'addClips', clips: loaded });
      // A clip that is too long arrives already cut, so its panel opens to show where.
      const cut = loaded.filter((clip) => clip.duration > MAX_CLIP_SECONDS + 0.05).map((clip) => clip.id);
      if (cut.length) setPanelOpen((open) => [...open, ...cut]);
      setProblems(results.flatMap((r, i) => (r.status === 'rejected' ? [`${files[i].name} ${r.reason.message}`] : [])));
      setLoading(false);
    },
    [dispatch],
  );

  // Video files can be dropped anywhere on the page or pasted with Ctrl+V.
  useEffect(() => {
    const hasFiles = (event) => event.dataTransfer?.types.includes('Files');
    const onDragOver = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setFilesOver(true);
    };
    const onDragLeave = (event) => {
      if (!event.relatedTarget) setFilesOver(false);
    };
    const onDrop = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setFilesOver(false);
      addFiles(event.dataTransfer.files);
    };
    const onPaste = (event) => {
      const videos = [...(event.clipboardData?.files ?? [])].filter(isVideoFile);
      if (videos.length) addFiles(videos);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', onPaste);
    };
  }, [addFiles]);

  const update = (clip, patch) => dispatch({ type: 'updateClip', id: clip.id, patch });

  const move = (from, to) => {
    if (to >= 0 && to < clips.length && to !== from) dispatch({ type: 'moveClip', from, to });
  };

  const remove = (clip) => {
    dispatch({ type: 'removeClip', id: clip.id });
    disposeClip(clip);
  };

  // A second piece of the same file, placed right after the first, for using two parts of one video.
  const addAgain = async (clip) => {
    try {
      const copy = await duplicateClip(clip);
      dispatch({ type: 'insertClip', after: clip.id, clip: copy });
      setPanelOpen((open) => [...open, copy.id]);
    } catch (error) {
      setProblems([`${clip.fileName} ${error.message}`]);
    }
  };

  const togglePanel = (id) => setPanelOpen((open) => (open.includes(id) ? open.filter((x) => x !== id) : [...open, id]));

  const endDrag = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  const advice = countAdvice(clips.length, format);

  return (
    <section className="step" aria-labelledby="step-clips">
      <StepHeading
        number={3}
        id="step-clips"
        title={fmt.clipsTitle}
        hint={`${fmt.clipsHint} The scissors open the cuts and framing for a clip.`}
      />

      {plan.items.length > 0 && (
        <div className="plan">
          <p className="field-label" id="plan-label">Clips to find for your idea</p>
          <ol aria-labelledby="plan-label">
            {plan.items.map((item) => {
              const found = clips.some((clip) => clip.name === item);
              return (
                <li key={item} data-found={found}>
                  <span className="plan-mark" aria-hidden="true">{found && <Check size={14} />}</span>
                  <span className="plan-name">
                    {item}
                    {found && <span className="visually-hidden"> (added)</span>}
                  </span>
                  <a href={tiktokSearch(item)} target="_blank" rel="noreferrer">Find on TikTok</a>
                </li>
              );
            })}
          </ol>
          <p className="field-note">
            Add the clips in this order and each one takes its name from the list.
            {plan.search && (
              <> To look for all of them at once, search for <a href={tiktokSearch(plan.search)} target="_blank" rel="noreferrer">{plan.search}</a>.</>
            )}{' '}
            <button type="button" className="link-btn" onClick={() => dispatch({ type: 'clearPlan' })}>Remove this list</button>
          </p>
        </div>
      )}

      <button
        type="button"
        className="dropzone"
        data-over={filesOver}
        aria-busy={loading}
        onClick={() => inputRef.current.click()}
      >
        <Upload size={22} aria-hidden="true" />
        <strong>{loading ? 'Reading clips…' : 'Add clips'}</strong>
        <span>Drop video files anywhere on this page, or click to choose them.</span>
        <span>MP4, MOV or WebM, up to 100 MB each. Longer than 60 seconds is fine: you cut it down after adding.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {restoring && <p className="status" role="status">Bringing back the clips from your last visit…</p>}
      {lost > 0 && (
        <div className="notice" role="alert">
          <span>
            {lost === 1 ? 'One file' : `${lost} files`} from your last visit could not be brought back. Add {lost === 1 ? 'it' : 'them'} again.
          </span>
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => dispatch({ type: 'dismissLost' })}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {storageProblem && <p className="hint-warning" role="status">{storageProblem}</p>}

      {problems.length > 0 && (
        <div className="notice" role="alert">
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setProblems([])}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      {clips.length > 0 && (
        <>
          <ol className="clip-list" data-format={format}>
            {clips.map((clip, i) => (
              <li
                key={clip.id}
                className="clip"
                data-dragging={dragFrom === i}
                data-over={dragFrom !== null && dragOver === i && dragFrom !== i}
                onDragOver={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  move(dragFrom, i);
                  endDrag();
                }}
              >
                <span
                  className="clip-handle"
                  draggable
                  title="Drag to move this clip"
                  aria-hidden="true"
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', clip.id);
                    e.dataTransfer.setDragImage(e.currentTarget.parentElement, 16, 28);
                    setDragFrom(i);
                  }}
                  onDragEnd={endDrag}
                >
                  <GripVertical size={18} />
                </span>
                <span className="rank">{fmt.pairs ? pairLabel(i) : i + 1}</span>
                <img className="clip-thumb" src={clip.thumb} alt="" />
                <span className="clip-fields">
                  <input
                    className="clip-name"
                    type="text"
                    value={clip.name}
                    maxLength={32}
                    placeholder={format === 'quiz' ? 'The answer' : format === 'story' ? 'Note for yourself' : format === 'versus' ? 'Name this choice' : 'Name this moment'}
                    aria-label={`Name for clip ${i + 1}`}
                    onChange={(e) => update(clip, { name: e.target.value })}
                  />
                  {format === 'scores' && (
                    <input
                      className="clip-score"
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={clip.score}
                      aria-label={`Score out of 10 for clip ${i + 1}`}
                      onChange={(e) => update(clip, { score: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
                    />
                  )}
                  {format === 'tiers' && (
                    <select
                      className="clip-tier"
                      value={clip.tier}
                      aria-label={`Tier for clip ${i + 1}`}
                      onChange={(e) => update(clip, { tier: e.target.value })}
                    >
                      {TIERS.map((tier) => (
                        <option key={tier.id} value={tier.id}>{tier.id}</option>
                      ))}
                    </select>
                  )}
                </span>
                <span className="clip-time">
                  {formatTime(clipLength(clip))}
                  {isTrimmed(clip) && <small> of {formatTime(clip.duration)}</small>}
                </span>
                <span className="clip-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Cut and frame clip ${i + 1}`}
                    aria-expanded={panelOpen.includes(clip.id)}
                    data-active={isTrimmed(clip) || isReframed(clip)}
                    onClick={() => togglePanel(clip.id)}
                  >
                    <Scissors size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn" disabled={i === 0} aria-label={`Move clip ${i + 1} up`} onClick={() => move(i, i - 1)}>
                    <ArrowUp size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn" disabled={i === clips.length - 1} aria-label={`Move clip ${i + 1} down`} onClick={() => move(i, i + 1)}>
                    <ArrowDown size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn danger" aria-label={`Remove ${clip.name || clip.fileName}`} onClick={() => remove(clip)}>
                    <X size={18} aria-hidden="true" />
                  </button>
                </span>
                {panelOpen.includes(clip.id) && (
                  <div className="clip-panel">
                    <TrimPanel clip={clip} rank={i + 1} dispatch={dispatch} onScrub={onScrub} onPreview={onPreview} />
                    <FramePanel clip={clip} rank={i + 1} dispatch={dispatch} onScrub={onScrub} onAddAgain={() => addAgain(clip)} />
                  </div>
                )}
              </li>
            ))}
          </ol>
          <p className="field-note">
            {advice} Total length {formatTime(total)}.
            {total > SHORTS_LIMIT_SECONDS && ' YouTube Shorts stops at 3:00, so drop or shorten a clip.'}
            {!storageProblem && ' Your clips are kept in this browser, so they are still here after a refresh.'}
          </p>
        </>
      )}
    </section>
  );
}
