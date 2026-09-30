// Short sounds for the moment a new clip starts. They are made from scratch here, so there is no
// file to download or license. All of them are optional: the default is no sound.
export const SOUNDS = [
  { value: 'none', label: 'No sound' },
  { value: 'whoosh', label: 'Whoosh' },
  { value: 'ding', label: 'Ding' },
  { value: 'pop', label: 'Pop' },
];

const TAU = Math.PI * 2;

// A rush of air: noise through a filter whose pitch sweeps up and back down.
function whoosh(rate) {
  const length = Math.round(rate * 0.42);
  const out = new Float32Array(length);
  // The same noise every time, so the sound does not change between the preview and the export.
  let seed = 22222;
  let low = 0;
  let band = 0;
  for (let i = 0; i < length; i++) {
    const t = i / length;
    seed = (seed * 16807) % 2147483647;
    const noise = seed / 1073741823.5 - 1;
    const centre = 350 + 3200 * Math.sin(Math.PI * t) ** 2;
    const f = 2 * Math.sin((Math.PI * centre) / rate);
    low += f * band;
    band += f * (noise - low - 0.35 * band);
    out[i] = band * 0.55 * Math.sin(Math.PI * t) ** 2;
  }
  return out;
}

// A small bell: three tones that die away at different speeds.
function ding(rate) {
  const length = Math.round(rate * 0.9);
  const out = new Float32Array(length);
  const tones = [
    { hz: 1318.5, level: 0.42, fade: 0.26 },
    { hz: 1975.5, level: 0.2, fade: 0.16 },
    { hz: 2637, level: 0.1, fade: 0.1 },
  ];
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const attack = Math.min(1, t / 0.004);
    let value = 0;
    for (const tone of tones) value += tone.level * Math.sin(TAU * tone.hz * t) * Math.exp(-t / tone.fade);
    out[i] = value * attack;
  }
  return out;
}

// A soft pop: one tone that drops quickly in pitch and volume.
function pop(rate) {
  const length = Math.round(rate * 0.14);
  const out = new Float32Array(length);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    phase += (TAU * (180 + 620 * Math.exp(-t / 0.025))) / rate;
    out[i] = 0.7 * Math.sin(phase) * Math.exp(-t / 0.04) * Math.min(1, t / 0.002);
  }
  return out;
}

const MAKERS = { whoosh, ding, pop };

// The sound as raw samples at the given rate, or null for 'none' and anything unknown.
export function soundSamples(kind, rate) {
  return MAKERS[kind] ? MAKERS[kind](rate) : null;
}

const made = new WeakMap();

// The sound as a buffer for this audio context. Each one is only made once per context.
export function soundBuffer(ctx, kind) {
  if (!MAKERS[kind]) return null;
  if (!made.has(ctx)) made.set(ctx, new Map());
  const buffers = made.get(ctx);
  if (!buffers.has(kind)) {
    const samples = soundSamples(kind, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples, 0);
    buffers.set(kind, buffer);
  }
  return buffers.get(kind);
}
