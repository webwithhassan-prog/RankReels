// Free Audio & AI Voice Agent Engine - 100% Free Web Audio API & Speech Synthesis
let audioCtx = null;
let bgMusicInterval = null;
let isPlayingMusic = false;

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Curated Free AI Voice Agent Personas (Mapped to natural browser TTS engines)
export const AI_VOICE_PERSONAS = [
  {
    id: 'agent-orion',
    name: 'Agent Orion',
    tag: 'Authority Founder',
    gender: 'Male',
    style: 'Deep, deliberate, high-conviction cadence',
    preferredVoicePatterns: ['Natural', 'Guy', 'David', 'Daniel', 'Alex', 'Google US English'],
    defaultPitch: 0.95,
    defaultRate: 1.02,
    sampleText: "Most founders waste $5,000 a month on dead channels. Here is the unfiltered ranking from S-tier to D-tier."
  },
  {
    id: 'agent-nova',
    name: 'Agent Nova',
    tag: 'Viral Marketer',
    gender: 'Female',
    style: 'Punchy, high-energy, fast-paced inflections',
    preferredVoicePatterns: ['Natural', 'Jenny', 'Samantha', 'Zira', 'Victoria', 'Google US English'],
    defaultPitch: 1.1,
    defaultRate: 1.15,
    sampleText: "Stop scrolling! If your first three seconds are boring, your reel is dead. Ranking the top 5 tools you must test."
  },
  {
    id: 'agent-echo',
    name: 'Agent Echo',
    tag: 'Tech Specialist',
    gender: 'Neutral / Crisp',
    style: 'Articulate, modern, analytical developer tone',
    preferredVoicePatterns: ['Natural', 'Christopher', 'Steffan', 'Fred', 'Google UK English Male'],
    defaultPitch: 1.0,
    defaultRate: 1.06,
    sampleText: "I benchmarked 40 AI developer frameworks so you don't waste 100 hours. The S-tier winner will surprise you."
  },
  {
    id: 'agent-lyra',
    name: 'Agent Lyra',
    tag: 'Executive Coach',
    gender: 'Female',
    style: 'Warm, calm, captivating storytelling',
    preferredVoicePatterns: ['Natural', 'Aria', 'Karen', 'Fiona', 'Moira'],
    defaultPitch: 1.02,
    defaultRate: 0.98,
    sampleText: "The fitness industry lies to you for easy clicks. Here is the science-backed tier list for busy people."
  }
];

// Match available browser voice to persona
export function matchVoiceForPersona(persona, availableVoices = []) {
  if (!availableVoices.length) return null;

  for (const pattern of persona.preferredVoicePatterns) {
    const match = availableVoices.find((v) =>
      v.name.toLowerCase().includes(pattern.toLowerCase())
    );
    if (match) return match;
  }
  return availableVoices[0];
}

// Procedural Lo-fi / Trap Beat generator (Zero MP3s, Zero paid libraries, purely Web Audio API oscillators)
export function startProceduralBeat(bpm = 92) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (isPlayingMusic) return;

  isPlayingMusic = true;
  const stepTime = (60 / bpm) / 4; // 16th notes
  let currentStep = 0;

  // Chord progression roots (Am7 - Fmaj7 - C - G)
  const chordRoots = [220, 174.61, 261.63, 196];

  bgMusicInterval = setInterval(() => {
    if (!isPlayingMusic) return;
    const now = ctx.currentTime;

    // Kick on steps 0, 8, 10
    if (currentStep === 0 || currentStep === 8 || currentStep === 10) {
      playKick(ctx, now);
    }

    // Snare / Rim on steps 4, 12
    if (currentStep === 4 || currentStep === 12) {
      playSnare(ctx, now);
    }

    // Closed Hi-hat on even steps
    if (currentStep % 2 === 0) {
      playHiHat(ctx, now);
    }

    // Lo-fi Pad Chord on step 0
    if (currentStep === 0) {
      const chordIndex = Math.floor((now / (stepTime * 16)) % chordRoots.length);
      playWarmChord(ctx, now, chordRoots[chordIndex]);
    }

    currentStep = (currentStep + 1) % 16;
  }, stepTime * 1000);
}

export function stopProceduralBeat() {
  isPlayingMusic = false;
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
}

function playKick(ctx, time) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.16);
  } catch {
    // Audio context may be closed
  }
}

function playSnare(ctx, time) {
  try {
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.1);
  } catch {
    // Audio context may be closed
  }
}

function playHiHat(ctx, time) {
  try {
    const bufferSize = ctx.sampleRate * 0.035;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.04);
  } catch {
    // Audio context may be closed
  }
}

function playWarmChord(ctx, time, rootFreq) {
  try {
    const freqs = [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 1.875];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.02, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 1.2);
    });
  } catch {
    // Audio context may be closed
  }
}

// Sound FX: Tier Slam
export function playTierSlamSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch {
    // Audio context may be closed
  }
}

// Sound FX: High Tier Ding
export function playChimeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    [900, 1350, 1800].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.4);
    });
  } catch {
    // Audio context may be closed
  }
}

// Get all voices
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
}

// Speak text using Web Speech
export function speakText(text, options = {}, onStart, onEnd, onBoundary) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = options.pitch ?? 1.0;
  utterance.rate = options.rate ?? 1.05;

  if (options.voice) {
    utterance.voice = options.voice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onBoundary) utterance.onboundary = onBoundary;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
