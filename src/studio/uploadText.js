import { formatById } from './formats.js';
import { wordKey } from './project.js';

const MAX_UPLOAD_TITLE = 100;
const MAX_TAGS = 8;

// The line that asks for a comment, which is what each format is built to provoke.
const HOOKS = {
  countdown: () => 'Do you agree with number 1? Put your own ranking in the comments.',
  levels: () => 'Which level could you reach? Tell me in the comments.',
  scores: () => 'What scores would you give? Tell me where I got it wrong.',
  tiers: () => 'Which one is in the wrong tier? Tell me in the comments.',
  quiz: (count) => `How many did you get out of ${count}? Put your score in the comments.`,
  story: () => 'Did you know this? Follow for more.',
  versus: () => 'Which would you pick each time? Comment 1 or 2.',
};

const FORMAT_TAGS = {
  countdown: ['ranking', 'top5'],
  levels: ['level1to100'],
  scores: ['rating'],
  tiers: ['tierlist'],
  quiz: ['quiz', 'guess'],
  story: ['facts', 'didyouknow'],
  versus: ['thisorthat', 'wouldyourather'],
};

// A starting point for the title, description and hashtags to paste in when uploading.
export function uploadText({ title, highlights, format, clips, script }) {
  const fmt = formatById(format);
  const line = title.replace(/\s+/g, ' ').trim();
  const hook = (HOOKS[fmt.id] ?? HOOKS.countdown)(clips.length);

  // Names are listed in alphabetical order so the description does not give the ranking away.
  // In Guess it the names are the answers, so they are left out.
  const names = [...new Set(clips.map((clip) => clip.name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const about =
    fmt.id === 'story'
      ? (script.match(/[^.!?]+[.!?]+/g) ?? []).slice(0, 2).join(' ').trim()
      : fmt.id !== 'quiz' && names.length
        ? `In this video: ${names.join(', ')}.`
        : '';

  const words = line.split(' ').map(wordKey).filter((key) => key.length > 3 && !/^\d+$/.test(key));
  const tags = [...new Set(['shorts', ...(FORMAT_TAGS[fmt.id] ?? []), ...highlights, ...words])]
    .map((tag) => tag.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .slice(0, MAX_TAGS);

  return {
    title: line.slice(0, MAX_UPLOAD_TITLE),
    description: [hook, about].filter(Boolean).join('\n\n'),
    hashtags: tags.map((tag) => `#${tag}`).join(' '),
  };
}
