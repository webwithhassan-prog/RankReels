import { captionAt } from './captions.js';
import { badgeFor, formatById, markerFor, quizRevealAt, tierColor } from './formats.js';
import { CANVAS_H as H, CANVAS_W as W, clipLength, fontWeight, wordKey } from './project.js';

const TITLE_TOP = 110;
const TITLE_SIDE = 60;
const TITLE_GAP = 36;
const LIST_LEFT = 40;
const PAD = 30;
// Shorts, Reels and TikTok cover the bottom of the frame with their own buttons and caption.
// In a full-frame layout the overlays stay above that.
const SAFE_BOTTOM = 400;
const SAFE_TOP = 120;
// The strip of background between the two clips of a this-or-that pair.
const PAIR_GAP = 8;
// How long a clip's entrance lasts, and how long the opening and closing lines stay up.
const ENTRANCE_SECONDS = 0.35;
const CARD_SECONDS = 1.5;

// What the last painted frame did with the current clip, so dragging the preview can move it by the right amount.
// `regions` has one entry per clip on screen, since a this-or-that frame shows two.
export const frameInfo = { clipId: null, overflowX: 0, overflowY: 0, regions: [] };

function fontString(style, size) {
  return `${fontWeight(style.font)} ${size}px "${style.font}", "Arial Black", sans-serif`;
}

export function titleFont(style) {
  return fontString(style, style.titleSize);
}

// Dark text on light fills, light text on dark fills.
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminance > 0.6 ? '#0B0B0B' : '#FFFFFF';
}

function wrapTitle(ctx, title, maxWidth) {
  const lines = [];
  for (const raw of title.split('\n')) {
    let line = [];
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      if (line.length && ctx.measureText([...line, word].join(' ')).width > maxWidth) {
        lines.push(line);
        line = [];
      }
      line.push(word);
    }
    if (line.length) lines.push(line);
  }
  return lines;
}

// Outlines go down before any fill so one word's outline never covers its neighbour.
function drawRuns(ctx, runs, x, y, outline, strokeColor) {
  const placed = runs.map((run) => {
    const at = x;
    x += ctx.measureText(run.text).width;
    return { ...run, x: at };
  });
  if (outline > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = outline * 2;
    ctx.strokeStyle = strokeColor;
    for (const run of placed) ctx.strokeText(run.text, run.x, y);
  }
  for (const run of placed) {
    ctx.fillStyle = run.color;
    ctx.fillText(run.text, run.x, y);
  }
}

function drawCentered(ctx, text, y, color, outline, strokeColor) {
  drawRuns(ctx, [{ text, color }], (W - ctx.measureText(text).width) / 2, y, outline, strokeColor);
}

// Smaller text gets a thinner outline, but never so thin that it stops doing its job.
function outlineFor(style, size) {
  return style.strokeWidth ? Math.max(3, (style.strokeWidth * size) / style.titleSize) : 0;
}

function layoutTitle(ctx, title, style) {
  ctx.font = titleFont(style);
  const lines = wrapTitle(ctx, title, W - TITLE_SIDE * 2);
  const lineHeight = style.titleSize * 1.14;
  return { lines, lineHeight, bottom: lines.length ? TITLE_TOP + lineHeight * lines.length + TITLE_GAP : TITLE_TOP };
}

function drawTitle(ctx, layout, highlights, style) {
  ctx.font = titleFont(style);
  layout.lines.forEach((words, i) => {
    const runs = words.map((word, n) => ({
      text: n < words.length - 1 ? `${word} ` : word,
      color: highlights.includes(wordKey(word)) ? style.highlightColor : style.textColor,
    }));
    const width = ctx.measureText(words.join(' ')).width;
    drawRuns(ctx, runs, (W - width) / 2, TITLE_TOP + layout.lineHeight * (i + 0.5), style.strokeWidth, style.strokeColor);
  });
}

let blurCanvas;

// Fills the clip area with a soft, darkened copy of the picture. Shrinking it to a few dozen pixels
// and stretching it back is the blur, which costs almost nothing per frame.
function drawBlurFill(ctx, source, sw, sh, box) {
  blurCanvas ||= document.createElement('canvas');
  const bw = 36;
  const bh = Math.max(8, Math.round((bw * box.h) / box.w));
  if (blurCanvas.width !== bw || blurCanvas.height !== bh) {
    blurCanvas.width = bw;
    blurCanvas.height = bh;
  }
  const scale = Math.max(bw / sw, bh / sh);
  blurCanvas.getContext('2d').drawImage(source, (bw - sw * scale) / 2, (bh - sh * scale) / 2, sw * scale, sh * scale);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(blurCanvas, box.x - 40, box.y - 40, box.w + 80, box.h + 80);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

// Draws the clip into its area with the clip's own zoom and position, and returns the part of the
// area the picture covers so the badge can sit on the clip itself.
function drawMedia(ctx, source, sw, sh, box, style, clip, shift = 0) {
  const fill = style.fit === 'fill';
  const scale = (fill ? Math.max(box.w / sw, box.h / sh) : Math.min(box.w / sw, box.h / sh)) * clip.zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const overflowX = Math.max(0, dw - box.w);
  const overflowY = Math.max(0, dh - box.h);
  const x = box.x + (box.w - dw) / 2 - (clip.panX * overflowX) / 2 + shift;
  const y = box.y + (box.h - dh) / 2 - (clip.panY * overflowY) / 2;
  Object.assign(frameInfo, { clipId: clip.id, overflowX, overflowY });
  frameInfo.regions.push({ clipId: clip.id, x: box.x, y: box.y, w: box.w, h: box.h, overflowX, overflowY });

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  if (!fill && style.blurBackground && (dw < box.w - 1 || dh < box.h - 1)) drawBlurFill(ctx, source, sw, sh, box);
  ctx.drawImage(source, x, y, dw, dh);
  ctx.restore();

  const left = Math.max(x, box.x);
  const top = Math.max(y, box.y);
  return { left, top, right: Math.min(x + dw, box.x + box.w), bottom: Math.min(y + dh, box.y + box.h) };
}

function drawEmptyBox(ctx, box, style) {
  const ink = readableOn(style.background);
  const inset = { x: box.x + 40, y: Math.max(box.y + 2, SAFE_TOP), w: box.w - 80 };
  inset.h = Math.min(box.y + box.h - 4, H - SAFE_BOTTOM) - inset.y;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.setLineDash([24, 18]);
  ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ink;
  ctx.font = '500 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Your clips play here', W / 2, inset.y + inset.h / 2);
  ctx.restore();
}

function drawList(ctx, rows, band, position, style) {
  const size = style.listSize;
  const rowHeight = size * 1.34;
  const height = rows.length * rowHeight;
  const top = position === 'bottom' ? band.bottom - PAD - height : band.top + (position === 'above' ? 0 : PAD);
  ctx.font = fontString(style, size);

  if (style.listPanel) {
    const width = Math.max(...rows.map((row) => ctx.measureText(`${row.marker} ${row.name}`).width));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.beginPath();
    ctx.roundRect(LIST_LEFT - 20, top - 10, width + 40, height + 20, 18);
    ctx.fill();
  }

  rows.forEach((row, i) => {
    const runs = [{ text: `${row.marker} `, color: row.markerColor ?? (row.current ? style.highlightColor : style.textColor) }];
    if (row.name) runs.push({ text: row.name, color: style.textColor });
    drawRuns(ctx, runs, LIST_LEFT, top + rowHeight * (i + 0.5), outlineFor(style, size), style.strokeColor);
  });
}

function drawBadge(ctx, badge, area, style) {
  const size = 60;
  const height = 96;
  ctx.font = fontString(style, size);
  const width = Math.max(height, ctx.measureText(badge.text).width + 56);
  const [vertical, horizontal] = style.badgePosition.split('-');
  const x = horizontal === 'right' ? area.right - PAD - width : area.left + PAD;
  const y = vertical === 'top' ? area.top + PAD : area.bottom - PAD - height;
  const color = badge.color ?? style.highlightColor;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = readableOn(color);
  ctx.textAlign = 'center';
  ctx.fillText(badge.text, x + width / 2, y + height / 2 + 2);
  ctx.textAlign = 'left';
}

// Guess it: a bar drains across the top of the clip while the seconds count down, then the answer lands.
function drawQuiz(ctx, clip, clipTime, revealAt, area, style) {
  if (clipTime < revealAt) {
    const left = revealAt - clipTime;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(area.left, area.top, area.right - area.left, 16);
    ctx.fillStyle = style.highlightColor;
    ctx.fillRect(area.left, area.top, (area.right - area.left) * (left / revealAt), 16);
    if (style.showBadge) drawBadge(ctx, { text: String(Math.ceil(left)) }, { ...area, top: area.top + 16 }, style);
    return;
  }
  const answer = clip.name.trim();
  if (!answer) return;
  let size = style.titleSize;
  ctx.font = fontString(style, size);
  const width = ctx.measureText(answer).width;
  if (width > W - 120) {
    size = Math.floor((size * (W - 120)) / width);
    ctx.font = fontString(style, size);
  }
  drawCentered(ctx, answer, area.bottom - 120, style.highlightColor, Math.max(6, outlineFor(style, size)), style.strokeColor);
}

// This or that: each clip gets its number and name, with a VS mark where the two meet.
function drawPair(ctx, halves, style) {
  const hasFooter = Boolean(style.footer.trim());
  halves.forEach((half, n) => {
    if (style.showBadge) drawBadge(ctx, { text: String(n + 1) }, half, style);
    const name = half.clip.name.trim();
    if (!name) return;
    let size = Math.round(style.listSize * 1.2);
    ctx.font = fontString(style, size);
    const width = ctx.measureText(name).width;
    if (width > W - 120) {
      size = Math.floor((size * (W - 120)) / width);
      ctx.font = fontString(style, size);
    }
    // The upper name sits above the VS mark. The lower one leaves room for the line that asks for the vote.
    const lift = n === 0 ? 72 : hasFooter ? 90 : 0;
    const y = half.bottom - 56 - lift;
    drawCentered(ctx, name, y, style.textColor, outlineFor(style, size), style.strokeColor);
  });

  const y = (halves[0].bottom + halves[1].top) / 2;
  ctx.beginPath();
  ctx.arc(W / 2, y, 66, 0, Math.PI * 2);
  ctx.fillStyle = style.highlightColor;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = style.strokeColor;
  ctx.stroke();
  ctx.font = fontString(style, 56);
  ctx.fillStyle = readableOn(style.highlightColor);
  ctx.textAlign = 'center';
  ctx.fillText('VS', W / 2, y + 2);
  ctx.textAlign = 'left';
}

// An opening or closing line: big text on a dark band across the middle of the clip.
function drawCard(ctx, text, y, style) {
  let size = Math.round(style.titleSize * 0.9);
  ctx.font = fontString(style, size);
  const width = ctx.measureText(text).width;
  if (width > W - 140) {
    size = Math.floor((size * (W - 140)) / width);
    ctx.font = fontString(style, size);
  }
  const band = size * 1.9;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, y - band / 2, W, band);
  drawCentered(ctx, text, y, style.highlightColor, Math.max(5, outlineFor(style, size)), style.strokeColor);
}

function drawProgress(ctx, fraction, y, style) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, y, W, 12);
  ctx.fillStyle = style.highlightColor;
  ctx.fillRect(0, y, W * Math.min(1, Math.max(0, fraction)), 12);
}

function drawCaptions(ctx, line, time, style) {
  const preset = style.captionPreset;
  const shouted = preset === 'karaoke' || preset === 'boxed';
  const size = preset === 'minimal' ? Math.round(style.captionSize * 0.8) : style.captionSize;
  const lineHeight = size * 1.22;
  ctx.font = fontString(style, size);

  const words = line.words.map((word) => ({
    ...word,
    text: shouted ? word.text.replace(/[.,;:]+$/, '').toUpperCase() : word.text,
  }));
  // The word being spoken stays lit through a pause, until the next one starts.
  const active = words.findLast((word) => word.start <= time);
  const widthOf = (group) => ctx.measureText(group.map((word) => word.text).join(' ')).width;
  const half = Math.ceil(words.length / 2);
  const rows = widthOf(words) <= W - 140 || words.length < 2 ? [words] : [words.slice(0, half), words.slice(half)];

  const base = preset === 'boxed' || preset === 'minimal' ? '#FFFFFF' : style.textColor;
  const lit = preset === 'karaoke' || preset === 'boxed';
  const outline = preset === 'karaoke' || preset === 'clean' ? Math.max(5, outlineFor(style, size)) : 0;

  rows.forEach((group, r) => {
    const y = (H * style.captionHeight) / 100 + lineHeight * (r - (rows.length - 1) / 2);
    const width = widthOf(group);
    const x = (W - width) / 2;
    if (preset === 'boxed') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.beginPath();
      ctx.roundRect(x - 28, y - lineHeight / 2, width + 56, lineHeight, 18);
      ctx.fill();
    }
    const runs = group.map((word, n) => ({
      text: n < group.length - 1 ? `${word.text} ` : word.text,
      color: lit && word === active ? style.highlightColor : base,
    }));
    ctx.save();
    if (preset === 'minimal') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 3;
    }
    drawRuns(ctx, runs, x, y, outline, style.strokeColor);
    ctx.restore();
  });
}

// Paints one 1080x1920 frame. The preview and the exported video both come from here.
// `scene` is what the project looks like; `playhead` is where playback is:
// { index, clipTime, time, voiceTime, video }. `video` is the player showing the current clip, which is
// the clip's spare one while an odd piece of a cut clip plays.
export function drawFrame(ctx, scene, playhead) {
  const { title, highlights, style, format, clips, order, captions, total } = scene;
  const { index, clipTime, time, voiceTime } = playhead;
  frameInfo.regions = [];
  const fmt = formatById(format);
  const full = style.fullFrame;

  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const titleLayout = layoutTitle(ctx, title, style);
  const titleShown = titleLayout.lines.length > 0 && (!full || !style.titleHold || time < style.titleHold);

  // With the list in its own band, the clip moves down to make room for every row.
  const listOn = fmt.list && clips.length > 0;
  const position = full && style.listPosition === 'above' ? 'top' : style.listPosition;
  const rowHeight = style.listSize * 1.34;
  const bandHeight = listOn && position === 'above' ? (style.showList ? clips.length : 1) * rowHeight + PAD : 0;

  const boxTop = titleLayout.bottom + bandHeight;
  const box = full
    ? { x: 0, y: 0, w: W, h: H }
    : { x: 0, y: boxTop, w: W, h: Math.min(Math.round((H * style.videoHeight) / 100), H - boxTop) };

  const currentId = order[index];
  const clip = clips.find((c) => c.id === currentId);
  if (!clip) {
    frameInfo.clipId = null;
    drawEmptyBox(ctx, box, style);
    if (titleShown) drawTitle(ctx, titleLayout, highlights, style);
    return;
  }

  // A clip's poster stands in until its player has a frame to show.
  // When rendering, the picture comes ready-made as `still` instead of from a player.
  // The optional entrance of each clip: a quick zoom that settles, or a slide in from the right.
  const settling = playhead.moving ? (1 - Math.min(1, clipTime / ENTRANCE_SECONDS)) ** 3 : 0;
  const shift = style.motion === 'swipe' && index > 0 ? W * settling : 0;
  const enter = (raw) => (style.motion === 'punch' ? { ...raw, zoom: raw.zoom * (1 + 0.14 * settling) } : raw);

  const show = (raw, player, into, still) => {
    const shown = enter(raw);
    if (still) return drawMedia(ctx, still, still.width, still.height, into, style, shown, shift);
    const video = player ?? shown.video;
    return video.readyState >= 2
      ? drawMedia(ctx, video, video.videoWidth, video.videoHeight, into, style, shown, shift)
      : drawMedia(ctx, shown.poster, shown.poster.width, shown.poster.height, into, style, shown, shift);
  };

  // This or that: the two clips of a pair share the clip area, one above the other.
  const partner = fmt.pairs ? clips[clips.indexOf(clip) + 1] : undefined;
  let halves = null;
  let picture;
  if (partner) {
    const half = Math.floor((box.h - PAIR_GAP) / 2);
    const upper = { ...box, h: half };
    const lower = { ...box, y: box.y + half + PAIR_GAP, h: box.h - half - PAIR_GAP };
    show(partner, playhead.partnerVideo, lower, playhead.partnerFrame);
    // The first clip is drawn last so dragging the preview moves it, not the second one.
    show(clip, playhead.video, upper, playhead.frame);
    halves = [
      { clip, left: upper.x, right: upper.x + upper.w, top: upper.y, bottom: upper.y + upper.h },
      { clip: partner, left: lower.x, right: lower.x + lower.w, top: lower.y, bottom: lower.y + lower.h },
    ];
    picture = { left: box.x, right: box.x + box.w, top: box.y, bottom: box.y + box.h };
  } else {
    picture = show(clip, playhead.video, box, playhead.frame);
  }

  // Where overlays may go: on the picture, or in a full frame between the title and the platform's own buttons.
  const area = full
    ? { left: 0, right: W, top: titleShown ? titleLayout.bottom : SAFE_TOP, bottom: H - SAFE_BOTTOM }
    : picture;

  if (style.progressBar && total > 0) drawProgress(ctx, time / total, box.y, style);
  if (titleShown) drawTitle(ctx, titleLayout, highlights, style);

  const revealAt = quizRevealAt(clipLength(clip));
  const revealed = format !== 'quiz' || clipTime >= revealAt;
  const named = order.slice(0, index);
  if (revealed) named.push(currentId);

  if (listOn) {
    const rows = clips
      .map((c, i) => ({
        clip: c,
        marker: markerFor(format, c, i, clips.length),
        markerColor: format === 'tiers' ? tierColor(c.tier) : undefined,
        name: named.includes(c.id) ? c.name.trim() : '',
        current: c.id === currentId,
      }))
      // A score or tier is the payoff, so those rows only appear once their clip has played.
      .filter((row) => (style.showList ? !fmt.growsList || named.includes(row.clip.id) || row.current : row.current));
    const band = position === 'above' ? { top: titleLayout.bottom, bottom: boxTop } : full ? area : { top: box.y, bottom: box.y + box.h };
    if (rows.length) drawList(ctx, rows, band, position, style);
  }

  if (halves) {
    // In a full frame the first clip's number and name stay clear of the title.
    halves[0].top = Math.max(halves[0].top, area.top);
    drawPair(ctx, halves, style);
  } else if (format === 'quiz') {
    drawQuiz(ctx, clip, clipTime, revealAt, area, style);
  } else if (style.showBadge) {
    const badge = badgeFor(format, clip, clips.indexOf(clip), clips.length);
    if (badge) drawBadge(ctx, badge, area, style);
  }

  const footer = style.footer.trim();
  if (footer) {
    const size = Math.round(style.listSize * 1.15);
    ctx.font = fontString(style, size);
    drawCentered(ctx, footer, area.bottom - 60, style.textColor, outlineFor(style, size), style.strokeColor);
  }

  const mark = (style.watermark ?? '').trim();
  if (mark) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.font = fontString(style, 34);
    const width = ctx.measureText(mark).width;
    drawRuns(ctx, [{ text: mark, color: '#FFFFFF' }], W - 32 - width, (full ? H - SAFE_BOTTOM : picture.bottom) - 30, 4, '#000000');
    ctx.restore();
  }

  // The optional opening and closing lines, each up for its stretch at the start or the end.
  const intro = (style.introText ?? '').trim();
  const outro = (style.outroText ?? '').trim();
  const middle = (area.top + area.bottom) / 2;
  if (intro && time < CARD_SECONDS) drawCard(ctx, intro, middle, style);
  else if (outro && total > CARD_SECONDS * 2 && total - time < CARD_SECONDS) drawCard(ctx, outro, middle, style);

  if (style.captionsOn && captions.length) {
    const line = captionAt(captions, voiceTime);
    if (line) drawCaptions(ctx, line, voiceTime, style);
  }
}
