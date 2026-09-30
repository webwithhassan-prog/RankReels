// The video formats the editor can lay out. A format changes what the overlays say and the default
// playing order; adding, cutting and framing clips works the same in all of them.
export const FORMATS = [
  {
    id: 'countdown',
    name: 'Countdown ranking',
    blurb: 'Numbered clips counted down to number 1. Shuffle the order for a blind ranking.',
    clipsTitle: 'Add your clips and rank them',
    clipsHint: 'The top of the list is number 1. Give each clip a short name viewers will see.',
    list: true,
    countsDown: true,
    ideas: [
      { title: 'Ranking best\nfootball moments', highlights: ['football', 'moments'] },
      { title: 'Ranking craziest\nnear misses', highlights: ['near', 'misses'] },
      { title: 'Blind ranking\nfunniest animal fails', highlights: ['animal', 'fails'] },
    ],
  },
  {
    id: 'levels',
    name: 'Level 1 to 100',
    blurb: 'Clips climb from easy to impossible. Viewers stay to see level 100.',
    clipsTitle: 'Add your clips, easiest first',
    clipsHint: 'The top of the list is level 1 and the bottom is level 100. Name each clip if you want a caption on it.',
    list: true,
    ideas: [
      { title: 'Level 1 to 100\ntrick shots', highlights: ['trick', 'shots'] },
      { title: 'Level 1 to 100\nparkour', highlights: ['parkour'] },
      { title: 'Level 1 to 100\nsatisfying cuts', highlights: ['satisfying', 'cuts'] },
    ],
  },
  {
    id: 'scores',
    name: 'Rate it out of 10',
    blurb: 'Every clip gets your score. Scores people disagree with fill the comments.',
    clipsTitle: 'Add your clips and score them',
    clipsHint: 'Clips play in list order. Name each one and give it a score out of 10.',
    list: true,
    // The score or tier is the payoff, so a row only appears once its clip has played.
    growsList: true,
    ideas: [
      { title: 'Rating viral\nfood hacks', highlights: ['food', 'hacks'] },
      { title: 'Rating famous\nmovie stunts', highlights: ['movie', 'stunts'] },
      { title: 'Rating goal\ncelebrations', highlights: ['celebrations'] },
    ],
  },
  {
    id: 'tiers',
    name: 'Tier list',
    blurb: 'Each clip lands in a tier from S down to D.',
    clipsTitle: 'Add your clips and pick their tiers',
    clipsHint: 'Clips play in list order. Name each one and choose its tier.',
    list: true,
    growsList: true,
    ideas: [
      { title: 'Tier list of\nstreet food', highlights: ['street', 'food'] },
      { title: 'Tier list of\nskate tricks', highlights: ['skate', 'tricks'] },
      { title: 'Tier list of\nwrestling finishers', highlights: ['wrestling', 'finishers'] },
    ],
  },
  {
    id: 'quiz',
    name: 'Guess it',
    blurb: 'A timer runs over each clip, then the answer appears. Viewers stay to check their score.',
    clipsTitle: 'Add your clips and their answers',
    clipsHint: 'Clips play in list order. The name is the answer, shown in the last moments of the clip.',
    list: true,
    ideas: [
      { title: 'Guess the\nfootballer', highlights: ['footballer'] },
      { title: 'Guess the movie\nfrom one scene', highlights: ['movie'] },
      { title: 'Guess the country\nfrom the street', highlights: ['country'] },
    ],
  },
  {
    id: 'story',
    name: 'Facts with voiceover',
    blurb: 'Clips play under your voiceover with word-by-word captions. No numbers on screen.',
    clipsTitle: 'Add clips to cover the voiceover',
    clipsHint: 'Clips play in list order. Cut each one to the part that matches what is being said.',
    list: false,
    ideas: [
      { title: 'Why airplane windows\nhave a tiny hole', highlights: ['tiny', 'hole'] },
      { title: 'The real reason\nzebras have stripes', highlights: ['zebras', 'stripes'] },
      { title: 'What happens if you\nfall into a black hole', highlights: ['black', 'hole'] },
    ],
  },
  {
    id: 'versus',
    name: 'This or that',
    blurb: 'Two clips on screen at once and viewers pick one. Every pair is a vote in the comments.',
    clipsTitle: 'Add your clips in pairs',
    clipsHint: 'Clips 1 and 2 play together, then 3 and 4, and so on. The first clip of a pair decides how long the pair stays up.',
    list: false,
    // Two clips share the screen: each clip in the playing order has the next one in the list beside it.
    pairs: true,
    ideas: [
      { title: 'This or that\nfootball skills', highlights: ['football', 'skills'] },
      { title: 'Which would\nyou rather eat', highlights: ['rather', 'eat'] },
      { title: 'Pick one\ndream cars', highlights: ['dream', 'cars'] },
    ],
  },
];

export function formatById(id) {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}

// The colors people already know from tier lists.
export const TIERS = [
  { id: 'S', color: '#FF7F7F' },
  { id: 'A', color: '#FFBF7F' },
  { id: 'B', color: '#FFDF7F' },
  { id: 'C', color: '#BFFF7F' },
  { id: 'D', color: '#7FBFFF' },
];

export function tierColor(id) {
  return TIERS.find((t) => t.id === id)?.color ?? TIERS[0].color;
}

// Spreads the clips from level 1 to level 100 in round steps.
export function levelOf(i, count) {
  if (count <= 1 || i === count - 1) return 100;
  if (i === 0) return 1;
  return Math.max(5, Math.round((100 * i) / (count - 1) / 5) * 5);
}

export function formatScore(score) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

// Pair number and side for a this-or-that video: 1A, 1B, 2A and so on.
export function pairLabel(i) {
  return `${Math.floor(i / 2) + 1}${i % 2 ? 'B' : 'A'}`;
}

// What stands in front of a clip's name in the on-screen list.
export function markerFor(format, clip, i, count) {
  if (format === 'levels') return `Lv ${levelOf(i, count)}`;
  if (format === 'scores') return formatScore(clip.score);
  if (format === 'tiers') return clip.tier;
  if (format === 'versus') return pairLabel(i);
  return `${i + 1}.`;
}

// The tag drawn on the clip itself. Guess it shows a timer there instead, and a voiceover video has none.
export function badgeFor(format, clip, i, count) {
  if (format === 'countdown') return { text: `#${i + 1}` };
  if (format === 'levels') return { text: `LEVEL ${levelOf(i, count)}` };
  if (format === 'scores') return { text: `${formatScore(clip.score)}/10` };
  if (format === 'tiers') return { text: clip.tier, color: tierColor(clip.tier) };
  return null;
}

// In Guess it the answer shows for the last stretch of the clip: long enough to read, short enough to stay a reveal.
export function quizRevealAt(length) {
  return Math.max(length - 1.5, length * 0.6);
}
