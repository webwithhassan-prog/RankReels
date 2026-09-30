import { useEffect, useMemo, useRef, useState } from 'react';
import { drawFrame, titleFont } from './drawFrame.js';
import { formatById, quizRevealAt } from './formats.js';
import { clipLength, pieces } from './project.js';
import { soundBuffer } from './sfx.js';
import { musicLevel } from './timeline.js';
import { RenderUnsupported, renderVideo } from './render.js';

const FPS = 30;
// About one frame: a clip counts as finished this close to its end mark.
const END_TOLERANCE = 0.03;
// How long the last picture is held while the next frame decodes, before falling back to the clip's poster.
const HOLD_MS = 400;
// MP4 plays everywhere, so it is tried first. WebM is the fallback for browsers that cannot record MP4.
const RECORDING_TYPES = [
  'video/mp4;codecs="avc1.640028,mp4a.40.2"',
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const IDLE = { status: 'idle' };

// Plays the clips in order onto the canvas and records that canvas when exporting.
// `scene` is everything drawFrame needs plus the sound: { track, music, audio }.
export function usePlayer(canvasRef, scene) {
  const sceneRef = useRef(scene);
  const indexRef = useRef(0);
  // Which of the current clip's pieces is playing. A clip with nothing cut out has one piece.
  const pieceRef = useRef(0);
  // The same for the clip shown alongside in a this-or-that video, and whether it has played out.
  const partnerPieceRef = useRef(0);
  const partnerDoneRef = useRef(false);
  // The clip whose answer sound has already played, so a pause and resume does not repeat it.
  const revealedRef = useRef(-1);
  const playingRef = useRef(false);
  const mutedRef = useRef(false);
  const dirtyRef = useRef(true);
  const scrubbingRef = useRef(false);
  const audioRef = useRef(null);
  const jobRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [exportState, setExportState] = useState(IDLE);

  const engine = useMemo(() => {
    const clipAt = (i) => {
      const { clips, order } = sceneRef.current;
      return clips.find((c) => c.id === order[i]);
    };
    // In a this-or-that video every clip in the playing order has the next clip in the list beside it.
    const partnerOf = (clip) => {
      const { clips, format } = sceneRef.current;
      if (!clip || !formatById(format).pairs) return undefined;
      return clips[clips.indexOf(clip) + 1];
    };
    const partnerAt = (i) => partnerOf(clipAt(i));
    const markDirty = () => {
      dirtyRef.current = true;
    };
    const setRunning = (on) => {
      playingRef.current = on;
      setPlaying(on);
    };
    const goTo = (i) => {
      indexRef.current = i;
      setIndex(i);
    };
    const pauseVideos = () => {
      for (const clip of sceneRef.current.clips) {
        clip.video.pause();
        clip.spare?.pause();
      }
    };

    // A clip with a part cut out plays its pieces on two players in turn: even pieces on the clip's
    // own player, odd ones on its spare. The piece that comes next is always cued and waiting on the
    // other player, so jumping over the cut does not freeze the picture.
    const videoFor = (clip, piece) => (piece % 2 === 1 && clip.spare ? clip.spare : clip.video);
    const activeVideo = () => {
      const clip = clipAt(indexRef.current);
      return clip ? videoFor(clip, pieceRef.current) : undefined;
    };
    const partnerVideo = () => {
      const partner = partnerAt(indexRef.current);
      return partner ? videoFor(partner, partnerPieceRef.current) : undefined;
    };

    // Seconds of the current clip that have played, not counting what was cut out.
    const clipSeconds = () => {
      const clip = clipAt(indexRef.current);
      if (!clip) return 0;
      const at = videoFor(clip, pieceRef.current).currentTime;
      return pieces(clip).reduce((sum, part) => sum + Math.min(Math.max(at - part.from, 0), part.to - part.from), 0) / (clip.speed || 1);
    };

    const elapsedSeconds = () => {
      let seconds = 0;
      for (let i = 0; i < indexRef.current; i++) {
        const played = clipAt(i);
        if (played) seconds += clipLength(played);
      }
      return seconds + clipSeconds();
    };

    // All sound runs through one graph so it can be muted on the speakers and still be recorded.
    // Clips, the voice, the music and the clip sound each get their own volume on the way in.
    const wireAudio = () => {
      let audio = audioRef.current;
      if (!audio) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const speakers = ctx.createGain();
        speakers.gain.value = mutedRef.current ? 0 : 1;
        speakers.connect(ctx.destination);
        const recording = ctx.createMediaStreamDestination();
        const bus = () => {
          const gain = ctx.createGain();
          gain.connect(speakers);
          gain.connect(recording);
          return gain;
        };
        audio = audioRef.current = {
          ctx,
          speakers,
          recording,
          clipBus: bus(),
          trackBus: bus(),
          musicBus: bus(),
          soundBus: bus(),
          wired: new WeakSet(),
        };
      }
      const connect = (element, to) => {
        if (audio.wired.has(element)) return;
        audio.ctx.createMediaElementSource(element).connect(to);
        audio.wired.add(element);
      };
      const { clips, track, music } = sceneRef.current;
      for (const { video, spare } of clips) {
        connect(video, audio.clipBus);
        if (spare) connect(spare, audio.clipBus);
      }
      if (track) connect(track.audio, audio.trackBus);
      if (music) connect(music.audio, audio.musicBus);
      applyVolumes();
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return audio;
    };

    // The music sits under the voice: it drops while words are spoken and fades out at the end.
    function levelMusic(glide) {
      const audio = audioRef.current;
      const current = sceneRef.current;
      if (!audio || !current.music) return;
      const level = current.audio.musicVolume * musicLevel(current, elapsedSeconds());
      if (glide) audio.musicBus.gain.setTargetAtTime(level, audio.ctx.currentTime, 0.09);
      else audio.musicBus.gain.value = level;
    }

    function applyVolumes() {
      const audio = audioRef.current;
      if (!audio) return;
      const volumes = sceneRef.current.audio;
      audio.clipBus.gain.value = volumes.clipVolume;
      audio.trackBus.gain.value = volumes.trackVolume;
      audio.soundBus.gain.value = volumes.sfxVolume;
      levelMusic(false);
    }

    const playSound = (kind) => {
      const audio = audioRef.current;
      const buffer = audio && soundBuffer(audio.ctx, kind);
      if (!buffer) return;
      const source = audio.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(audio.soundBus);
      source.start();
    };

    // The voice and the music run on their own clocks from one clip to the next, so they never stutter
    // at a cut. They are only re-aimed when playback jumps: a seek, a restart, a resume.
    const trackOf = () => sceneRef.current.track;
    const musicOf = () => sceneRef.current.music;
    const aimMusic = () => {
      const music = musicOf();
      if (!music) return;
      music.audio.loop = true;
      music.audio.currentTime = elapsedSeconds() % music.duration;
    };
    const pauseSound = () => {
      trackOf()?.audio.pause();
      musicOf()?.audio.pause();
    };
    const cueSound = () => {
      pauseSound();
      const track = trackOf();
      if (track) track.audio.currentTime = Math.min(elapsedSeconds(), track.duration);
      aimMusic();
    };
    const playSoundtrack = () => {
      const track = trackOf();
      const at = elapsedSeconds();
      if (track && at < track.duration - 0.05) {
        track.audio.currentTime = at;
        track.audio.play().catch(() => {});
      }
      const music = musicOf();
      if (music) {
        aimMusic();
        levelMusic(false);
        music.audio.play().catch(() => {});
      }
    };

    // Captions follow the voice itself, so they stay with the words even if a clip starts a frame late.
    const playhead = () => {
      const time = elapsedSeconds();
      const track = trackOf();
      return {
        index: indexRef.current,
        clipTime: clipSeconds(),
        time,
        voiceTime: track ? track.audio.currentTime : time,
        video: activeVideo(),
        partnerVideo: partnerVideo(),
        // Entrances only move while playing, so a paused preview shows the clip where it will settle.
        moving: playingRef.current,
      };
    };

    // Seeking only when the position is off keeps an already cued player ready to play at once.
    const cue = (video, time) => {
      if (Math.abs(video.currentTime - time) > 0.01) video.currentTime = time;
    };

    // A clip's speed is set on its player each time it starts. The pitch moves with it, as in the export.
    const setRate = (video, clip) => {
      video.playbackRate = clip.speed || 1;
      video.preservesPitch = false;
    };

    const within = (part, at) => Boolean(part) && at >= part.from - 0.05 && at < part.to - END_TOLERANCE;

    // A piece stops at its own end mark, which usually comes before the file's end. After the last
    // piece the clip is over.
    function checkEnd(video) {
      const clip = clipAt(indexRef.current);
      if (!playingRef.current || !clip || videoFor(clip, pieceRef.current) !== video) return;
      const parts = pieces(clip);
      const part = parts[pieceRef.current];
      if (part && !video.ended && video.currentTime < part.to - END_TOLERANCE) return;
      video.pause();
      if (part && pieceRef.current < parts.length - 1) startPiece(indexRef.current, pieceRef.current + 1);
      else onClipEnded();
    }

    // play() also rejects when a later seek interrupts it, which is not a reason to stop.
    const playVideo = (video) => {
      video.onended = () => checkEnd(video);
      video.ontimeupdate = () => checkEnd(video);
      video.play().catch(() => {
        if (video.paused && activeVideo() === video) setRunning(false);
      });
    };

    // The clip alongside plays its own pieces and simply stops on its last frame when it runs out.
    // The clip in the playing order decides how long the pair is on screen.
    function startPartner(piece, from) {
      const partner = partnerAt(indexRef.current);
      const parts = partner ? pieces(partner) : [];
      if (!parts[piece]) return;
      partnerPieceRef.current = piece;
      partnerDoneRef.current = false;
      const video = videoFor(partner, piece);
      const other = videoFor(partner, piece + 1);
      if (other !== video) other.pause();
      cue(video, from ?? parts[piece].from);
      setRate(video, partner);
      video.onended = null;
      video.ontimeupdate = null;
      video.play().catch(() => {});
      if (parts[piece + 1] && other !== video) cue(other, parts[piece + 1].from);
    }

    function checkPartner() {
      const partner = partnerAt(indexRef.current);
      if (!playingRef.current || !partner || partnerDoneRef.current) return;
      const parts = pieces(partner);
      const part = parts[partnerPieceRef.current];
      const video = videoFor(partner, partnerPieceRef.current);
      if (part && !video.ended && video.currentTime < part.to - END_TOLERANCE) return;
      video.pause();
      if (part && partnerPieceRef.current < parts.length - 1) startPartner(partnerPieceRef.current + 1);
      else partnerDoneRef.current = true;
    }

    // Picks the clip alongside up where it was left: mid-piece after a pause, or wherever its handle
    // was dragged to.
    function resumePartner(scrubbed) {
      const partner = partnerAt(indexRef.current);
      if (!partner || partnerDoneRef.current) return;
      const parts = pieces(partner);
      const at = (scrubbed ? partner.video : videoFor(partner, partnerPieceRef.current)).currentTime;
      const piece = scrubbed ? parts.findIndex((part) => within(part, at)) : partnerPieceRef.current;
      if (within(parts[piece], at)) startPartner(piece, at);
      else if (scrubbed) startPartner(0);
    }

    // `jumped` is true when playback lands here from anywhere but the end of what played before.
    // `from` starts the piece partway in, for picking up where a pause or a dragged handle left it.
    function startPiece(i, piece, jumped = false, from) {
      const scrubbed = scrubbingRef.current;
      scrubbingRef.current = false;
      goTo(i);
      pieceRef.current = piece;
      const clip = clipAt(i);
      const parts = pieces(clip);
      const video = videoFor(clip, piece);
      const other = videoFor(clip, piece + 1);
      if (other !== video) other.pause();
      cue(video, from ?? parts[piece].from);
      setRate(video, clip);
      playVideo(video);
      if (from !== undefined) resumePartner(scrubbed);
      else if (piece === 0) {
        revealedRef.current = -1;
        startPartner(0);
        // The clip sound marks each new clip. In Guess it, it is kept for the answer instead.
        if (!jumped && i > 0 && sceneRef.current.format !== 'quiz') playSound(sceneRef.current.audio.sfx);
      }
      if (jumped) playSoundtrack();
      // Cueing what plays next now means the cut to it shows its first frame, not wherever it was left.
      if (parts[piece + 1] && other !== video) cue(other, parts[piece + 1].from);
      const next = clipAt(i + 1);
      if (next) {
        next.video.pause();
        cue(next.video, pieces(next)[0].from);
        const beside = partnerOf(next);
        if (beside) {
          beside.video.pause();
          cue(beside.video, pieces(beside)[0].from);
        }
      }
    }

    const startClip = (i, jumped = false) => startPiece(i, 0, jumped);

    function onClipEnded() {
      const next = indexRef.current + 1;
      if (next < sceneRef.current.order.length) {
        startClip(next);
        return;
      }
      pauseVideos();
      setRunning(false);
      pauseSound();
      markDirty();
      const job = jobRef.current;
      // A short tail lets the recorder pick up the final frames before it stops.
      if (job) setTimeout(() => job.recorder.state !== 'inactive' && job.recorder.stop(), 250);
    }

    // In Guess it the clip sound plays as the answer appears.
    const checkReveal = () => {
      const current = sceneRef.current;
      if (current.format !== 'quiz' || revealedRef.current === indexRef.current) return;
      const clip = clipAt(indexRef.current);
      if (!clip || clipSeconds() < quizRevealAt(clipLength(clip))) return;
      revealedRef.current = indexRef.current;
      playSound(current.audio.sfx);
    };

    // Still frames are always shown on each clip's own player, as its first piece.
    const showStill = (i, leadTime, partnerTime) => {
      pieceRef.current = 0;
      partnerPieceRef.current = 0;
      partnerDoneRef.current = false;
      revealedRef.current = -1;
      const clip = clipAt(i);
      const partner = partnerAt(i);
      for (const [shown, time] of [[clip, leadTime], [partner, partnerTime]]) {
        if (!shown) continue;
        shown.video.addEventListener('seeked', markDirty, { once: true });
        shown.video.currentTime = time ?? pieces(shown)[0].from;
      }
      markDirty();
    };

    const rewind = (i) => {
      pauseVideos();
      scrubbingRef.current = false;
      goTo(i);
      showStill(i);
      cueSound();
    };

    const play = () => {
      const clip = clipAt(indexRef.current);
      if (!clip) return;
      wireAudio();
      setRunning(true);
      const parts = pieces(clip);
      const at = activeVideo().currentTime;
      // After a handle was dragged the picture can be anywhere in the file, so the piece is looked up.
      const piece = scrubbingRef.current ? parts.findIndex((part) => within(part, at)) : pieceRef.current;
      if (within(parts[piece], at)) {
        startPiece(indexRef.current, piece, true, at);
        return;
      }
      // Outside what plays: either the whole video has finished, or a handle was dragged into a cut part.
      const finished = indexRef.current === sceneRef.current.order.length - 1 && !scrubbingRef.current;
      startClip(finished ? 0 : indexRef.current, true);
    };

    // Shows one frame of a clip while its trim or cut handles are dragged. In a this-or-that video the
    // clip may be the one alongside, which is shown next to the start of the clip it is paired with.
    const scrub = (id, time) => {
      const { order } = sceneRef.current;
      const asLead = order.indexOf(id);
      const i = asLead >= 0 ? asLead : order.findIndex((_, n) => partnerAt(n)?.id === id);
      if (i < 0 || jobRef.current) return;
      pauseVideos();
      setRunning(false);
      goTo(i);
      scrubbingRef.current = true;
      if (asLead >= 0) showStill(i, time);
      else showStill(i, undefined, time);
      cueSound();
    };

    const pause = () => {
      pauseVideos();
      pauseSound();
      setRunning(false);
    };

    const seek = (i) => {
      const count = sceneRef.current.order.length;
      if (!count) return;
      const target = Math.max(0, Math.min(count - 1, i));
      if (playingRef.current) {
        pauseVideos();
        startClip(target, true);
      } else {
        rewind(target);
      }
    };

    const previous = () => {
      seek(clipSeconds() > 2 ? indexRef.current : indexRef.current - 1);
    };

    const reset = () => {
      setRunning(false);
      rewind(0);
    };

    // Lets someone hear a clip sound when they pick it.
    const previewSound = (kind) => {
      wireAudio();
      playSound(kind);
    };

    const fail = (message) => setExportState({ status: 'error', message });

    // The fast way: the video is built frame by frame without playing it. Browsers that cannot encode
    // video fall back to recording the preview as it plays.
    const startExport = async () => {
      if (!sceneRef.current.order.length || jobRef.current) return;
      pause();
      reset();
      const job = { fast: true, control: new AbortController() };
      jobRef.current = job;
      setExportState({ status: 'rendering', progress: 0, fast: true });
      try {
        const blob = await renderVideo(sceneRef.current, {
          signal: job.control.signal,
          onProgress: (progress) => setExportState((state) => (state.status === 'rendering' ? { ...state, progress } : state)),
        });
        jobRef.current = null;
        setExportState({ status: 'ready', url: URL.createObjectURL(blob), size: blob.size, extension: 'mp4' });
      } catch (error) {
        jobRef.current = null;
        if (job.control.signal.aborted) setExportState(IDLE);
        else if (error instanceof RenderUnsupported) recordExport();
        else fail(`The video was not exported: ${error.message} Try again, or close other heavy tabs first.`);
      }
    };

    const recordExport = () => {
      const canvas = canvasRef.current;
      if (!canvas || !sceneRef.current.order.length || jobRef.current) return;
      if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
        fail('This browser cannot record video. Open RankReel in Chrome or Edge and export again.');
        return;
      }

      reset();
      const audio = wireAudio();
      const mimeType = RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
      const picture = canvas.captureStream(FPS);
      const stream = new MediaStream([...picture.getVideoTracks(), ...audio.recording.stream.getAudioTracks()]);

      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 });
      } catch {
        fail('The recorder could not start in this browser. Open RankReel in Chrome or Edge and export again.');
        return;
      }

      const chunks = [];
      const job = { recorder, cancelled: false };
      jobRef.current = job;
      audio.speakers.gain.value = 0;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        job.cancelled = true;
        fail('Rendering stopped partway. Close other heavy tabs and export again.');
      };
      recorder.onstop = () => {
        picture.getTracks().forEach((track) => track.stop());
        audio.speakers.gain.value = mutedRef.current ? 0 : 1;
        jobRef.current = null;
        reset();
        if (job.cancelled) {
          setExportState((state) => (state.status === 'error' ? state : IDLE));
          return;
        }
        const type = (recorder.mimeType || mimeType || 'video/webm').split(';')[0];
        const blob = new Blob(chunks, { type });
        setExportState({
          status: 'ready',
          url: URL.createObjectURL(blob),
          size: blob.size,
          extension: type.includes('mp4') ? 'mp4' : 'webm',
        });
      };

      setExportState({ status: 'rendering', progress: 0 });
      // A short lead-in so the recording opens on the first clip, not on a stale canvas.
      setTimeout(() => {
        if (job.cancelled) return;
        recorder.start(1000);
        setRunning(true);
        startClip(0, true);
      }, 100);
    };

    const cancelExport = () => {
      const job = jobRef.current;
      if (!job) return;
      if (job.fast) {
        job.control.abort();
        return;
      }
      job.cancelled = true;
      pauseVideos();
      pauseSound();
      if (job.recorder.state === 'inactive') {
        jobRef.current = null;
        setExportState(IDLE);
      } else {
        job.recorder.stop();
      }
    };

    // The canvas only repaints while the tab is visible, so a hidden tab pauses the render.
    const onVisibilityChange = () => {
      const job = jobRef.current;
      if (!job?.recorder) return;
      const videos = [activeVideo(), partnerDoneRef.current ? undefined : partnerVideo()];
      if (document.hidden && job.recorder.state === 'recording') {
        job.recorder.pause();
        videos.forEach((video) => video?.pause());
        pauseSound();
      } else if (!document.hidden && job.recorder.state === 'paused') {
        job.recorder.resume();
        videos.forEach((video) => video?.play().catch(() => {}));
        playSoundtrack();
      }
    };

    // Run on every painted frame while playing, so clips stop on their end marks, not a quarter second late.
    const everyFrame = () => {
      const video = activeVideo();
      if (video) checkEnd(video);
      checkPartner();
      checkReveal();
      levelMusic(true);
    };

    return {
      markDirty,
      elapsedSeconds,
      playhead,
      applyVolumes,
      currentVideo: activeVideo,
      everyFrame,
      play,
      pause,
      seek,
      scrub,
      previous,
      reset,
      previewSound,
      startExport,
      cancelExport,
      onVisibilityChange,
    };
  }, [canvasRef]);

  useEffect(() => {
    sceneRef.current = scene;
    dirtyRef.current = true;
    engine.applyVolumes();
  });

  // Reordering, adding or removing clips restarts the preview from the first clip.
  const orderKey = scene.order.join('|');
  useEffect(() => {
    engine.reset();
  }, [engine, orderKey]);

  // Canvas text falls back to a system font until the chosen one has loaded.
  const font = titleFont(scene.style);
  useEffect(() => {
    document.fonts.load(font).then(engine.markDirty, engine.markDirty);
  }, [engine, font]);

  useEffect(() => {
    mutedRef.current = muted;
    const audio = audioRef.current;
    if (audio && !jobRef.current?.recorder) audio.speakers.gain.value = muted ? 0 : 1;
  }, [muted]);

  useEffect(() => {
    let frame;
    let lastPaint = 0;
    let lastClock = 0;
    let painted = false;
    let waitingSince = 0;
    const paint = (now) => {
      lastPaint = now;
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (playingRef.current) engine.everyFrame();
      if (!playingRef.current && !dirtyRef.current) return;

      // While a seek is decoding, the last picture stays up so cuts and trim drags do not flicker.
      const video = engine.currentVideo();
      if (painted && video && video.readyState < 2) {
        waitingSince ||= now;
        if (now - waitingSince < HOLD_MS) {
          dirtyRef.current = true;
          return;
        }
      } else {
        waitingSince = 0;
      }

      dirtyRef.current = false;
      painted = true;
      drawFrame(canvas.getContext('2d'), sceneRef.current, engine.playhead());
      if (now - lastClock < 200) return;
      lastClock = now;
      const seconds = engine.elapsedSeconds();
      setElapsed(seconds);
      if (jobRef.current?.recorder) {
        const progress = Math.min(1, seconds / (sceneRef.current.total || 1));
        setExportState((state) => (state.status === 'rendering' ? { ...state, progress } : state));
      }
    };
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      paint(now);
    };
    frame = requestAnimationFrame(tick);
    // Browsers stop animation frames for a window that is covered but not hidden. A timer takes over
    // then, so an export keeps moving and the preview is never left showing a stale frame.
    const fallback = setInterval(() => {
      const now = performance.now();
      if (now - lastPaint > 60) paint(now);
    }, 1000 / FPS);
    document.addEventListener('visibilitychange', engine.onVisibilityChange);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(fallback);
      document.removeEventListener('visibilitychange', engine.onVisibilityChange);
    };
  }, [canvasRef, engine]);

  const closeExport = () => {
    if (exportState.url) URL.revokeObjectURL(exportState.url);
    setExportState(IDLE);
  };

  return {
    index,
    playing,
    muted,
    elapsed,
    exportState,
    play: engine.play,
    pause: engine.pause,
    seek: engine.seek,
    scrub: engine.scrub,
    previous: engine.previous,
    next: () => engine.seek(index + 1),
    toggleMuted: () => setMuted((m) => !m),
    previewSound: engine.previewSound,
    startExport: engine.startExport,
    cancelExport: engine.cancelExport,
    closeExport,
  };
}
