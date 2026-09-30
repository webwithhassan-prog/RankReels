import { useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { formatById, markerFor } from '../studio/formats.js';
import { BACKGROUND_COLORS, shuffledOrder } from '../studio/project.js';
import { Segmented, Select, Slider, StepHeading, Swatches, Toggle } from './controls.jsx';

const FIT_MODES = [
  { value: 'fill', label: 'Fill the area' },
  { value: 'fit', label: 'Show the whole clip' },
];

const LIST_POSITIONS = [
  { value: 'top', label: 'Top of the clip' },
  { value: 'bottom', label: 'Bottom of the clip' },
  { value: 'above', label: 'Above the clip' },
];

const ENTRANCES = [
  { value: 'none', label: 'Just cut' },
  { value: 'punch', label: 'Zoom in' },
  { value: 'swipe', label: 'Slide in' },
];

const BADGE_POSITIONS = [
  { value: 'top-right', label: 'Top right' },
  { value: 'top-left', label: 'Top left' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
];

export default function OrderStep({ clips, order, customOrder, format, style, dispatch }) {
  const [selected, setSelected] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const setStyle = (patch) => dispatch({ type: 'style', patch });
  const fmt = formatById(format);
  const countsDown = Boolean(fmt.countsDown);
  // What takes a turn in the playing order: every clip, or in a this-or-that video the first of each pair.
  const turns = fmt.pairs ? clips.filter((_, i) => i % 2 === 0) : clips;

  const moveTo = (from, to) => {
    if (from < 0 || to < 0 || to >= order.length || to === from) return;
    const next = [...order];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    dispatch({ type: 'order', order: next });
  };

  const selectedAt = order.indexOf(selected);
  // Re-ranking after a shuffle can leave number 1 in the middle of a custom order.
  const bestNotLast = countsDown && customOrder && clips.length > 1 && order[order.length - 1] !== clips[0].id;
  const orderModes = [
    { value: 'plain', label: countsDown ? 'Countdown' : 'List order' },
    { value: 'custom', label: 'Custom' },
  ];
  // The list cannot sit in its own band when the clip already covers the whole frame.
  const listPositions = style.fullFrame ? LIST_POSITIONS.filter((p) => p.value !== 'above') : LIST_POSITIONS;

  return (
    <section className="step" aria-labelledby="step-order">
      <StepHeading
        number={5}
        id="step-order"
        title="Set the playing order and layout"
        hint={
          countsDown
            ? 'Each clip keeps its rank. Jumping around instead of counting straight down keeps people watching for number 1.'
            : 'Clips play in the order of your list unless you choose a custom order here.'
        }
      />

      <div className="order-bar">
        <Segmented
          label="Playing order"
          options={orderModes}
          value={customOrder ? 'custom' : 'plain'}
          onChange={(mode) => dispatch({ type: 'customOrder', on: mode === 'custom' })}
        />
        <button
          type="button"
          className="btn"
          disabled={turns.length < 3}
          onClick={() => dispatch({ type: 'order', order: shuffledOrder(turns, order, countsDown) })}
        >
          <Shuffle size={18} aria-hidden="true" />
          Shuffle
        </button>
        {customOrder && (
          <span className="order-nudge">
            <button type="button" className="icon-btn" disabled={selectedAt < 1} aria-label="Play the selected clip earlier" onClick={() => moveTo(selectedAt, selectedAt - 1)}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" disabled={selectedAt < 0 || selectedAt === order.length - 1} aria-label="Play the selected clip later" onClick={() => moveTo(selectedAt, selectedAt + 1)}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>

      {clips.length === 0 ? (
        <p className="empty">Add clips in step 3 and their playing order shows up here.</p>
      ) : (
        <>
          <ol className="order-strip">
            {order.map((id, i) => {
              const at = clips.findIndex((c) => c.id === id);
              const clip = clips[at];
              const beside = fmt.pairs ? clips[at + 1] : undefined;
              // A pair shows as its number and both choices.
              const name = fmt.pairs
                ? [clip.name.trim() || 'A', beside ? beside.name.trim() || 'B' : ''].filter(Boolean).join(' or ')
                : clip.name.trim();
              const marker = fmt.pairs
                ? String(at / 2 + 1)
                : format === 'countdown'
                  ? `#${at + 1}`
                  : markerFor(format, clip, at, clips.length).replace(/\.$/, '');
              const content = (
                <>
                  <b>{marker}</b>
                  {name && <span>{name}</span>}
                </>
              );
              return (
                <li key={id}>
                  {customOrder ? (
                    <button
                      type="button"
                      className="order-chip"
                      draggable
                      aria-pressed={selected === id}
                      aria-label={`Plays ${i + 1} of ${order.length}: clip ${at + 1}${name ? `, ${name}` : ''}`}
                      onClick={() => setSelected(selected === id ? null : id)}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                        e.preventDefault();
                        setSelected(id);
                        moveTo(i, i + (e.key === 'ArrowLeft' ? -1 : 1));
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', id);
                        setDragFrom(i);
                      }}
                      onDragOver={(e) => dragFrom !== null && e.preventDefault()}
                      onDrop={(e) => {
                        if (dragFrom === null) return;
                        e.preventDefault();
                        moveTo(dragFrom, i);
                        setDragFrom(null);
                      }}
                      onDragEnd={() => setDragFrom(null)}
                    >
                      {content}
                    </button>
                  ) : (
                    <span className="order-chip">{content}</span>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="field-note">
            {customOrder
              ? 'Plays left to right. Drag a clip to move it, or select it and use the arrow buttons or arrow keys.'
              : countsDown
                ? 'Plays left to right, from the lowest rank up to number 1.'
                : 'Plays left to right, in the order of your list.'}
            {countsDown ? ' Shuffle mixes it up and saves number 1 for last.' : ' Shuffle mixes up every clip.'}
            {turns.length < 3 && (fmt.pairs ? ' Shuffle needs at least 3 pairs.' : ' Shuffle needs at least 3 clips.')}
          </p>
          {bestNotLast && (
            <p className="hint-warning" role="status">
              Number 1 is not playing last. Move it to the end, or shuffle again, so viewers stay for the reveal.
            </p>
          )}
        </>
      )}

      {format !== 'story' && (
        <details className="more">
          <summary>Names and badge on the clip</summary>
          <div className="more-body">
            <div className="field">
              <span className="field-label">Where the names go</span>
              <Segmented label="Where the names go" options={listPositions} value={style.fullFrame && style.listPosition === 'above' ? 'top' : style.listPosition} onChange={(listPosition) => setStyle({ listPosition })} />
              <p className="field-note">Move them if they cover writing or faces in your clips. Above the clip gives them their own strip.</p>
            </div>
            <Toggle
              label="Keep names on screen"
              hint="Shows the whole list for the whole video. Each name fills in when its clip plays. Off shows only the current clip's name."
              checked={style.showList}
              onChange={(showList) => setStyle({ showList })}
            />
            <Toggle
              label="Dark panel behind the names"
              hint="Keeps the names readable over busy or bright clips."
              checked={style.listPanel}
              onChange={(listPanel) => setStyle({ listPanel })}
            />
            <Slider label="Name size" value={style.listSize} min={28} max={72} unit=" px" onChange={(listSize) => setStyle({ listSize })} />
            <Toggle
              label={format === 'quiz' ? 'Countdown number' : 'Badge'}
              hint={format === 'quiz' ? 'The seconds left before the answer.' : 'The tag on each clip, such as its rank, level, score or tier.'}
              checked={style.showBadge}
              onChange={(showBadge) => setStyle({ showBadge })}
            />
            <Select label="Badge corner" options={BADGE_POSITIONS} value={style.badgePosition} onChange={(badgePosition) => setStyle({ badgePosition })} />
          </div>
        </details>
      )}

      <details className="more">
        <summary>Clip area, background and extras</summary>
        <div className="more-body">
          <Toggle
            label="Clip fills the whole frame"
            hint="The clip covers the full 9:16 screen and the title sits on top of it."
            checked={style.fullFrame}
            onChange={(fullFrame) => setStyle({ fullFrame })}
          />
          {style.fullFrame ? (
            <Slider
              label="Seconds the title stays (0 keeps it for the whole video)"
              value={style.titleHold}
              min={0}
              max={10}
              unit=" s"
              onChange={(titleHold) => setStyle({ titleHold })}
            />
          ) : (
            <Slider label="Clip height" value={style.videoHeight} min={40} max={80} unit="%" onChange={(videoHeight) => setStyle({ videoHeight })} />
          )}
          <div className="field">
            <span className="field-label">Clip fit</span>
            <Segmented label="Clip fit" options={FIT_MODES} value={style.fit} onChange={(fit) => setStyle({ fit })} />
            <p className="field-note">Zoom and position for a single clip are under its scissors in step 3.</p>
          </div>
          {style.fit === 'fit' && (
            <Toggle
              label="Blurred background"
              hint="Fills the empty space around the clip with a blurred copy of it instead of a flat color."
              checked={style.blurBackground}
              onChange={(blurBackground) => setStyle({ blurBackground })}
            />
          )}
          <Swatches label="Background color" colors={BACKGROUND_COLORS} value={style.background} onChange={(background) => setStyle({ background })} />
          <Toggle
            label="Progress bar"
            hint="A bar along the top of the clip that fills as the video plays."
            checked={style.progressBar}
            onChange={(progressBar) => setStyle({ progressBar })}
          />
          <div className="field">
            <label htmlFor="footer">Line on the clip</label>
            <input
              id="footer"
              type="text"
              maxLength={40}
              value={style.footer}
              placeholder="Wait for number 1"
              onChange={(e) => setStyle({ footer: e.target.value })}
            />
            <p className="field-note">Shown near the bottom of the clip for the whole video. Leave it empty for none.</p>
          </div>
          <div className="field">
            <span className="field-label">How each clip comes in</span>
            <Segmented label="How each clip comes in" options={ENTRANCES} value={style.motion} onChange={(motion) => setStyle({ motion })} />
          </div>
          <div className="field">
            <label htmlFor="watermark">Your @handle on the video</label>
            <input id="watermark" type="text" maxLength={30} value={style.watermark} placeholder="@yourchannel" onChange={(e) => setStyle({ watermark: e.target.value })} />
            <p className="field-note">Shown small in the bottom corner of every frame. Leave it empty for none.</p>
          </div>
          <div className="field">
            <label htmlFor="intro-text">Opening line</label>
            <input id="intro-text" type="text" maxLength={40} value={style.introText} placeholder="Wait for number 1" onChange={(e) => setStyle({ introText: e.target.value })} />
            <p className="field-note">Shown big over the first 1.5 seconds. Leave it empty for none.</p>
          </div>
          <div className="field">
            <label htmlFor="outro-text">Closing line</label>
            <input id="outro-text" type="text" maxLength={40} value={style.outroText} placeholder="Follow for part 2" onChange={(e) => setStyle({ outroText: e.target.value })} />
            <p className="field-note">Shown big over the last 1.5 seconds. Leave it empty for none.</p>
          </div>
        </div>
      </details>
    </section>
  );
}
