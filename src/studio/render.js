import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  canEncodeAudio,
  canEncodeVideo,
} from 'mediabunny';
import { drawFrame } from './drawFrame.js';
import { CANVAS_H, CANVAS_W, pieces } from './project.js';
import { soundBuffer } from './sfx.js';
import { fileTimeAt, musicLevel, rounds, soundTimes } from './timeline.js';

// Makes the finished video without playing it: every frame is decoded, drawn and encoded as fast as
// this computer can manage, and the sound is mixed separately. It keeps going in a background tab.
const FPS = 30;
const RATE = 48000;
// How often the music level is set while mixing, in seconds.
const LEVEL_STEP = 0.05;

// Thrown when this browser cannot encode the video, so the caller can fall back to recording it.
export class RenderUnsupported extends Error {}

export async function canRender() {
  if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') return false;
  const [video, audio] = await Promise.all([
    canEncodeVideo('avc', { width: CANVAS_W, height: CANVAS_H, bitrate: 8_000_000 }),
    canEncodeAudio('aac', { numberOfChannels: 2, sampleRate: RATE }),
  ]);
  return video && audio;
}

function openFile(file) {
  return new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
}

// Places each stretch of a clip's own sound where it plays in the video.
async function mixClip(ctx, to, clip, start, length) {
  const track = await openFile(clip.file).getPrimaryAudioTrack();
  if (!track) return;
  const sink = new AudioBufferSink(track);
  // A sped-up or slowed clip plays its sound at the same rate, so the pitch moves with it.
  const speed = clip.speed || 1;
  let played = 0;
  for (const part of pieces(clip)) {
    if (played >= length) break;
    const from = part.from;
    const until = Math.min(part.to, from + (length - played) * speed);
    const at = start + played;
    for await (const { buffer, timestamp, duration } of sink.buffers(from, until)) {
      const a = Math.max(timestamp, from);
      const b = Math.min(timestamp + duration, until);
      if (b <= a) continue;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(to);
      source.playbackRate.value = speed;
      source.start(at + (a - from) / speed, a - timestamp, b - a);
    }
    played += (until - from) / speed;
  }
}

async function mixSound(scene, total) {
  const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(total * RATE)), RATE);
  const bus = (volume) => {
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    return gain;
  };
  const { audio, track, music } = scene;

  const clips = bus(audio.clipVolume);
  for (const round of rounds(scene)) {
    await mixClip(ctx, clips, round.clip, round.start, round.length);
    if (round.partner) await mixClip(ctx, clips, round.partner, round.start, round.length);
  }

  if (track) {
    const source = ctx.createBufferSource();
    source.buffer = await ctx.decodeAudioData(await track.file.arrayBuffer());
    source.connect(bus(audio.trackVolume));
    source.start(0);
  }

  if (music) {
    const level = bus(0);
    for (let t = 0; t <= total; t += LEVEL_STEP) {
      level.gain.linearRampToValueAtTime(audio.musicVolume * musicLevel({ ...scene, total }, t), t);
    }
    const source = ctx.createBufferSource();
    source.buffer = await ctx.decodeAudioData(await music.file.arrayBuffer());
    source.loop = true;
    source.connect(level);
    source.start(0);
  }

  const sound = soundBuffer(ctx, audio.sfx);
  if (sound) {
    const sounds = bus(audio.sfxVolume);
    for (const t of soundTimes(scene)) {
      const source = ctx.createBufferSource();
      source.buffer = sound;
      source.connect(sounds);
      source.start(t);
    }
  }
  return ctx.startRendering();
}

// One second of the mixed sound, so it can be handed to the encoder alongside the pictures.
function slice(mixed, from, to) {
  const start = Math.round(from * RATE);
  const end = Math.min(mixed.length, Math.round(to * RATE));
  const part = new AudioBuffer({ length: Math.max(1, end - start), numberOfChannels: 2, sampleRate: RATE });
  for (let channel = 0; channel < 2; channel++) {
    part.copyToChannel(mixed.getChannelData(channel).subarray(start, Math.max(start + 1, end)), channel);
  }
  return part;
}

// Resolves with the finished MP4 as a Blob. `onProgress` gets a number from 0 to 1.
export async function renderVideo(scene, { onProgress, signal }) {
  if (!(await canRender())) throw new RenderUnsupported('This browser cannot encode video.');
  const list = rounds(scene);
  const total = list.reduce((sum, round) => sum + round.length, 0);
  const frameCount = Math.max(1, Math.round(total * FPS));

  const mixed = await mixSound(scene, total);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const pictures = new CanvasSource(canvas, { codec: 'avc', bitrate: 8_000_000 });
  const sound = new AudioBufferSource({ codec: 'aac', quality: QUALITY_HIGH });
  output.addVideoTrack(pictures, { frameRate: FPS });
  output.addAudioTrack(sound);
  await output.start();

  try {
    let frame = 0;
    let soundUntil = 0;
    for (let r = 0; r < list.length; r++) {
      const round = list[r];
      const first = Math.round(round.start * FPS);
      const last = r === list.length - 1 ? frameCount : Math.round((round.start + round.length) * FPS);
      const times = [];
      for (let f = first; f < last; f++) times.push(f / FPS - round.start);
      // Each clip on screen is read once, in order, at the moments it is shown.
      const reader = async (clip) => {
        if (!clip) return null;
        const track = await openFile(clip.file).getPrimaryVideoTrack();
        return track ? new CanvasSink(track, { poolSize: 2 }).canvasesAtTimestamps(times.map((t) => fileTimeAt(clip, t))) : null;
      };
      const lead = await reader(round.clip);
      const beside = await reader(round.partner);
      let leadPicture = null;
      let besidePicture = null;

      for (let i = 0; i < times.length; i++, frame++) {
        if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        // A missing frame (before the first one, or past the end of a clip) keeps the last picture up.
        leadPicture = (lead && (await lead.next()).value?.canvas) || leadPicture;
        besidePicture = (beside && (await beside.next()).value?.canvas) || besidePicture;
        const time = frame / FPS;
        drawFrame(ctx, scene, {
          index: r,
          clipTime: times[i],
          time,
          voiceTime: time,
          frame: leadPicture,
          partnerFrame: besidePicture,
          moving: true,
        });
        await pictures.add(time, 1 / FPS);
        // The sound goes in a second at a time, keeping pace with the pictures.
        while (soundUntil < Math.min(total, time + 1)) {
          const next = Math.min(total, soundUntil + 1);
          await sound.add(slice(mixed, soundUntil, next));
          soundUntil = next;
        }
        if (frame % 10 === 0) onProgress(frame / frameCount);
      }
      await lead?.return();
      await beside?.return();
    }
    while (soundUntil < total) {
      const next = Math.min(total, soundUntil + 1);
      await sound.add(slice(mixed, soundUntil, next));
      soundUntil = next;
    }
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  }
  onProgress(1);
  return new Blob([output.target.buffer], { type: 'video/mp4' });
}
