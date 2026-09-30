import { generate, warmUp } from './ai.js';
import { FORMATS, formatById, levelOf } from './formats.js';
import { MAX_TITLE, wordKey } from './project.js';

export const IDEA_COUNT = 3;
export const MAX_TOPIC = 80;
const ITEM_COUNT = 5;
// Clip names are capped at this length in the editor.
const MAX_ITEM = 32;
const MAX_HEADLINES = 6;
const WORDS_PER_SECOND = 2.6;

// The formats an idea can be planned for. A this-or-that video needs its clips in pairs, which the
// planner is not asked to do.
export const IDEA_FORMATS = FORMATS.filter((format) => !format.pairs);

export const STARTER_TOPICS = ['Football', 'Street food', 'Animals', 'Cars', 'Gaming', 'Movies'];

// Kept word for word the same between requests, so the model can reuse its work on this part.
const PLANNER = `You plan short vertical videos (YouTube Shorts, TikTok, Reels) that are edited together from existing clips.

The formats:
- countdown: clips ranked and counted down to number 1. Title like "Ranking the craziest near misses". items = ${ITEM_COUNT} specific, well known things, the best one first.
- levels: clips that climb from level 1 to level 100. Title like "Level 1 to 100 trick shots". items = ${ITEM_COUNT} feats, from the easiest to the most extreme.
- scores: every clip gets a score out of 10. Title like "Rating viral food hacks". items = ${ITEM_COUNT} specific, well known things.
- tiers: every clip lands in a tier from S down to D. Title like "Tier list of skate tricks". items = ${ITEM_COUNT} specific, well known things, the best one first.
- quiz: viewers guess what each clip shows before the answer appears. Title like "Guess the footballer". items = the ${ITEM_COUNT} answers.
- story: one surprising fact told by a voiceover. Title like "Why airplane windows have a tiny hole". items = the ${ITEM_COUNT} shots to show, in order.

Rules:
- title: 3 to 7 words, plain text, no emoji, no hashtags, no quotation marks. It names a narrow angle, not just the topic.
- keywords: the 1 or 2 words from the title that say what the video is about.
- items: things that exist on video and that a viewer would recognise by name, 1 to 4 words each, no numbering. Be specific: "Tacos al pastor", not "Tacos".
- search: a short phrase to type into TikTok search to find these clips.
- Headlines, when given, are only background on what is new this week. Use one only if it points to something people are looking for right now, such as a new release, a big match or a viral moment. Never copy a headline into items.`;

const WRITER =
  'You write voiceovers for short vertical videos. Plain spoken English, short sentences, no emoji, no hashtags, ' +
  'no headings, no stage directions. Reply with the words to be spoken and nothing else.';

const TITLER =
  'You write titles for short vertical videos. Each title is 3 to 7 words of plain text with no emoji, no hashtags ' +
  'and no quotation marks. keywords are the 1 or 2 words from the title that say what the video is about.';

function ideaSchema(format) {
  return {
    type: 'object',
    properties: {
      ideas: {
        type: 'array',
        minItems: IDEA_COUNT,
        maxItems: IDEA_COUNT,
        items: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: format ? [format] : IDEA_FORMATS.map((f) => f.id) },
            title: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
            items: { type: 'array', items: { type: 'string' }, minItems: ITEM_COUNT, maxItems: ITEM_COUNT },
            search: { type: 'string' },
          },
          required: ['format', 'title', 'keywords', 'items', 'search'],
        },
      },
    },
    required: ['ideas'],
  };
}

const TITLES_SCHEMA = {
  type: 'object',
  properties: {
    titles: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 } },
        required: ['title', 'keywords'],
      },
    },
  },
  required: ['titles'],
};

function tidy(text) {
  return String(text ?? '')
    .replace(/["“”#*_]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cuts at a word boundary, so a long name loses whole words instead of ending mid-word.
function shorten(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)).replace(/[\s,;:'’-]+$/, '');
}

// Breaks a title where its two lines come out closest in length.
export function twoLines(text) {
  const words = tidy(text).replace(/[.!]+$/, '').slice(0, MAX_TITLE).split(' ').filter(Boolean);
  if (words.length < 3) return words.join(' ');
  let best = 1;
  let bestGap = Infinity;
  for (let at = 1; at < words.length; at++) {
    const gap = Math.abs(words.slice(0, at).join(' ').length - words.slice(at).join(' ').length);
    if (gap < bestGap) {
      best = at;
      bestGap = gap;
    }
  }
  return `${words.slice(0, best).join(' ')}\n${words.slice(best).join(' ')}`;
}

// The model's keywords when they really are in the title, otherwise the title's last long words.
function highlightsFor(title, keywords) {
  const inTitle = title.split(/\s+/).filter(Boolean).map(wordKey);
  const asked = (Array.isArray(keywords) ? keywords : []).flatMap((keyword) => tidy(keyword).split(' ')).map(wordKey);
  // A title where most words are highlighted has no highlight at all.
  const most = Math.min(3, Math.max(1, Math.floor(inTitle.length / 2)));
  const kept = [...new Set(asked.filter((key) => inTitle.includes(key)))].slice(0, most);
  if (kept.length) return kept;
  return inTitle.filter((key) => key.length > 3).slice(-2);
}

export function readIdea(raw) {
  const title = twoLines(raw.title);
  if (!title) return null;
  const items = (Array.isArray(raw.items) ? raw.items : [])
    // Models like to number a list or label tiers even when told not to.
    .map((item) => shorten(tidy(item).replace(/^(\d+[.):]|[SABCD]:|level \d+:?)\s*/i, ''), MAX_ITEM))
    .filter(Boolean);
  return {
    format: formatById(raw.format).id,
    title,
    highlights: highlightsFor(title, raw.keywords),
    items: [...new Set(items)],
    search: tidy(raw.search).slice(0, 60),
  };
}

// The ideas whose JSON is already complete while the rest of the reply is still being written.
function finishedIdeas(text) {
  const start = text.indexOf('[');
  if (start < 0) return [];
  const found = [];
  let depth = 0;
  let from = -1;
  let inString = false;
  let escaped = false;
  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) from = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          found.push(JSON.parse(text.slice(from, i + 1)));
        } catch {
          // A broken object is skipped; the others are still usable.
        }
      }
    }
  }
  return found;
}

function today() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// This week's headlines about the topic, or an empty list when there is no server to fetch them.
export async function fetchHeadlines(topic, signal) {
  try {
    const response = await fetch(`/feeds/news?q=${encodeURIComponent(topic)}`, { signal });
    if (!response.ok) return [];
    const { items } = await response.json();
    return items.map((item) => item.title).slice(0, MAX_HEADLINES);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return [];
  }
}

export async function fetchTrending() {
  try {
    const response = await fetch('/feeds/trends');
    if (!response.ok) return [];
    const { items } = await response.json();
    return items.map((item) => item.title).filter(Boolean).slice(0, 6);
  } catch {
    return [];
  }
}

// Called when someone starts typing a topic, so the model is ready by the time they ask.
export function prepare(model) {
  warmUp(model, PLANNER);
}

// Calls `onIdeas` with the list so far each time another idea is finished.
export async function suggestIdeas({ topic, format, headlines, model, signal, onIdeas }) {
  const news = headlines.length
    ? `\nHeadlines about it from this week:\n${headlines.map((line) => `- ${line}`).join('\n')}\n`
    : '';
  const ask = format
    ? `Give ${IDEA_COUNT} different video ideas about this topic, all in the ${format} format.`
    : `Give ${IDEA_COUNT} video ideas about this topic, each in a different format.`;
  const read = (text) => finishedIdeas(text).map(readIdea).filter(Boolean);
  let shown = 0;
  const text = await generate({
    model,
    system: PLANNER,
    prompt: `Today is ${today()}.\nTopic: ${topic}\n${news}\n${ask}`,
    schema: ideaSchema(format),
    maxTokens: 700,
    signal,
    onText: (soFar) => {
      const ideas = read(soFar);
      if (ideas.length > shown) {
        shown = ideas.length;
        onIdeas(ideas);
      }
    },
  });
  return read(text);
}

export async function suggestTitles({ title, format, model, signal }) {
  const fmt = formatById(format);
  const text = await generate({
    model,
    system: TITLER,
    prompt: `The video is a ${fmt.name.toLowerCase()}: ${fmt.blurb}\nIts title now: ${title.replace('\n', ' ')}\n\nGive 4 other titles for the same video. Make each one a different angle, and keep the subject.`,
    schema: TITLES_SCHEMA,
    maxTokens: 250,
    signal,
  });
  const { titles = [] } = JSON.parse(text);
  return titles
    .map((raw) => {
      const next = twoLines(raw.title);
      return next ? { title: next, highlights: highlightsFor(next, raw.keywords) } : null;
    })
    .filter(Boolean);
}

// Models often wrap a script in a lead-in line or quotation marks.
function cleanScript(text) {
  return text
    .replace(/^\s*[^\n]*:\s*\n+/, '')
    .replace(/[*_#]/g, '')
    .replace(/^["“\s]+|["”\s]+$/g, '');
}

// How many words fill the video: its length when there are clips, otherwise a typical Short.
export function scriptWords(seconds) {
  return Math.round(Math.max(40, Math.min(160, (seconds || 27) * WORDS_PER_SECOND)) / 10) * 10;
}

export async function writeScript({ title, format, outline, seconds, model, signal, onText }) {
  const fmt = formatById(format);
  const words = scriptWords(seconds);
  const clips = outline.length
    ? `The clips, in the order they play:\n${outline.join('\n')}\n\n`
    : '';
  const each = outline.length ? 'Say one short line about each clip, in that order. ' : '';
  const text = await generate({
    model,
    system: WRITER,
    prompt:
      `Title: ${title.replace('\n', ' ')}\nKind of video: ${fmt.name.toLowerCase()}. ${fmt.blurb}\n\n${clips}` +
      `Write a voiceover of ${words} words at most. Start with a hook that makes people stay. ${each}` +
      'End with a question viewers will want to answer in the comments.',
    maxTokens: Math.round(words * 1.6) + 40,
    temperature: 0.7,
    signal,
    onText: (soFar) => onText(cleanScript(soFar)),
  });
  // A reply that ran into the length limit stops mid-sentence, so it is cut back to its last full one.
  const script = cleanScript(text);
  const lastStop = Math.max(script.lastIndexOf('.'), script.lastIndexOf('?'), script.lastIndexOf('!'));
  return lastStop > 0 ? script.slice(0, lastStop + 1) : script;
}

const UPLOADER =
  'You write the upload text for short vertical videos on YouTube Shorts, TikTok and Reels. The title is catchy, ' +
  'at most 70 characters, may use one emoji, and does not give away the answer or the number 1. The description is ' +
  '2 or 3 short lines: a hook, what the video shows without spoiling it, and a question that gets comments. ' +
  'hashtags are 6 to 8 single words without the # sign, starting with shorts, mixing broad and specific ones.';

const UPLOAD_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    hashtags: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 8 },
  },
  required: ['title', 'description', 'hashtags'],
};

// A title, description and hashtags written by the model from the video's title, format, clips and script.
export async function writeUploadText({ title, format, outline, script, model, signal }) {
  const fmt = formatById(format);
  const clips = outline.length ? `The clips, in the order they play:\n${outline.join('\n')}\n` : '';
  const voice = script.trim() ? `The voiceover:\n${script.trim()}\n` : '';
  const text = await generate({
    model,
    system: UPLOADER,
    prompt: `On-screen title: ${title.replace('\n', ' ')}\nKind of video: ${fmt.name.toLowerCase()}. ${fmt.blurb}\n${clips}${voice}\nWrite the upload text.`,
    schema: UPLOAD_SCHEMA,
    maxTokens: 400,
    temperature: 0.8,
    signal,
  });
  const raw = JSON.parse(text);
  const tags = [...new Set((raw.hashtags ?? []).map((tag) => String(tag).replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()).filter(Boolean))];
  return {
    title: String(raw.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
    description: String(raw.description ?? '').replace(/[*_#]/g, '').trim(),
    hashtags: tags.slice(0, 8).map((tag) => `#${tag}`).join(' '),
  };
}

// What the script writer is told about the clips: their names with the rank, level, score or tier viewers see.
// Before any clip is added, the clips planned by the idea stand in for them.
export function outlineFor({ format, clips, order, plan }) {
  const line = (name, at, count, clip) => {
    if (!name) return '';
    if (format === 'countdown') return `Number ${at + 1}: ${name}`;
    if (format === 'levels') return `Level ${levelOf(at, count)}: ${name}`;
    if (format === 'scores' && clip) return `${name}, scored ${clip.score} out of 10`;
    if (format === 'tiers' && clip) return `${name}, tier ${clip.tier}`;
    if (format === 'quiz') return `Answer: ${name}`;
    return name;
  };
  if (clips.length) {
    return order
      .map((id) => {
        const at = clips.findIndex((clip) => clip.id === id);
        return line(clips[at].name.trim(), at, clips.length, clips[at]);
      })
      .filter(Boolean);
  }
  const planned = plan.items.map((name, at) => line(name, at, plan.items.length, null));
  return formatById(format).countsDown ? planned.reverse() : planned;
}

// Titles that need no model: used when Ollama is not running.
export function readyMadeIdeas(topic) {
  const subject = tidy(topic).toLowerCase();
  if (!subject) return FORMATS.map((format) => ({ format: format.id, ...format.ideas[0], items: [], search: '' }));
  const keys = subject.split(' ').map(wordKey).slice(0, 3);
  const titles = {
    countdown: `Ranking the best\n${subject} moments`,
    levels: `Level 1 to 100\n${subject}`,
    scores: `Rating viral\n${subject} clips`,
    tiers: `Tier list of\n${subject}`,
    quiz: `Guess the\n${subject}`,
    story: `The truth about\n${subject}`,
    versus: `This or that\n${subject}`,
  };
  return FORMATS.map((format) => ({
    format: format.id,
    title: titles[format.id].slice(0, MAX_TITLE),
    highlights: keys,
    items: [],
    search: subject,
  }));
}
