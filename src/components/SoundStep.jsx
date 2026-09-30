import { useEffect, useRef, useState } from 'react';
import { Ear, FileAudio, Mic, Music, Sparkles, Square, X } from 'lucide-react';
import { disposeTrack, loadTrack, recordVoice } from '../studio/audioTrack.js';
import {
  CAPTION_PRESETS,
  MAX_CLIP_SECONDS,
  MAX_SCRIPT,
  MIN_CLIP_SECONDS,
  clipLength,
  endForLength,
  formatTime,
} from '../studio/project.js';
import { scriptWords, writeScript } from '../studio/ideas.js';
import { hearWords } from '../studio/listen.js';
import { SOUNDS } from '../studio/sfx.js';
import { VOICE_COUNT, VOICE_GROUPS, speak } from '../studio/voice.js';
import { Segmented, Select, Slider, StepHeading, Toggle } from './controls.jsx';

// A steady read runs at roughly this many words a second.
const WORDS_PER_SECOND = 2.6;

// Shares the voiceover's length between the clips as evenly as each clip's own length allows.
function lengthsToFit(clips, seconds) {
  // The most each clip could play: from its start mark to as far as its end mark may go, less what is cut out.
  const room = clips.map((clip) => clipLength({ ...clip, end: Math.min(clip.duration, clip.start + MAX_CLIP_SECONDS) }));
  const lengths = clips.map(() => 0);
  let left = seconds;
  let open = clips.map((_, i) => i);
  while (open.length && left > 0.01) {
    const share = left / open.length;
    open = open.filter((i) => {
      const add = Math.min(share, room[i] - lengths[i]);
      lengths[i] += add;
      left -= add;
      return room[i] - lengths[i] > 0.01;
    });
  }
  return lengths.map((length) => Math.max(length, MIN_CLIP_SECONDS));
}

export default function SoundStep({ ai, title, outline, script, track, music, audio, style, clips, format, dispatch, onSound }) {
  const fileRef = useRef(null);
  const musicRef = useRef(null);
  const takeRef = useRef(null);
  const trackRef = useRef(track);
  const writerRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [problem, setProblem] = useState(null);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [writing, setWriting] = useState(false);
  // The script as it was before the model replaced it, so it can be brought back.
  const [replaced, setReplaced] = useState(null);

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  useEffect(() => () => writerRef.current?.abort(), []);

  const recording = busy === 'recording';
  useEffect(() => {
    if (!recording) return undefined;
    const started = Date.now();
    const timer = setInterval(() => setRecordedSeconds((Date.now() - started) / 1000), 250);
    return () => clearInterval(timer);
  }, [recording]);

  const setAudio = (patch) => dispatch({ type: 'audio', patch });
  const setStyle = (patch) => dispatch({ type: 'style', patch });

  // `spoken` is true for a voice made or recorded here, where the clips should drop back behind it.
  const takeFile = async (file, spoken) => {
    setBusy('Reading the sound…');
    setProblem(null);
    try {
      const next = await loadTrack(file);
      const previous = trackRef.current;
      dispatch({ type: 'track', track: next });
      if (previous) disposeTrack(previous);
      if (spoken) setAudio({ clipVolume: format === 'story' ? 0 : 0.2 });
    } catch (error) {
      setProblem(`${file.name} ${error.message}`);
    }
    setBusy(null);
  };

  const removeTrack = () => {
    dispatch({ type: 'track', track: null });
    disposeTrack(track);
  };

  const takeMusic = async (file) => {
    setBusy('Reading the music…');
    setProblem(null);
    try {
      const next = await loadTrack(file);
      dispatch({ type: 'music', music: next });
      if (music) disposeTrack(music);
    } catch (error) {
      setProblem(`${file.name} ${error.message}`);
    }
    setBusy(null);
  };

  const removeMusic = () => {
    dispatch({ type: 'music', music: null });
    disposeTrack(music);
  };

  const makeVoice = async () => {
    setBusy('Starting the voice model…');
    setProblem(null);
    try {
      const file = await speak(script, audio.voice, audio.speed, (progress) =>
        setBusy(
          progress.phase === 'download'
            ? `Downloading the voice model. This happens once: ${Math.round(progress.fraction * 100)}%`
            : `Speaking sentence ${progress.done + 1} of ${progress.of}…`,
        ),
      );
      await takeFile(file, true);
    } catch (error) {
      setProblem(`The voiceover was not made: ${error.message} Check your connection and make it again.`);
      setBusy(null);
    }
  };

  // Listens to the voice to find when each word is said. With no script yet, what was heard becomes
  // the script, ready to be corrected.
  const matchCaptions = async () => {
    setBusy('Starting the listening model…');
    setProblem(null);
    try {
      const heard = await hearWords(track.file, (progress) =>
        setBusy(
          progress.phase === 'download'
            ? `Downloading the listening model. This happens once: ${Math.round(progress.fraction * 100)}%`
            : 'Listening to the voice…',
        ),
      );
      if (!heard.length) throw new Error('No words were heard in the voice.');
      if (trackRef.current) dispatch({ type: 'track', track: { ...trackRef.current, words: heard } });
      if (!script.trim()) dispatch({ type: 'script', value: heard.map((word) => word.text).join(' ') });
    } catch (error) {
      setProblem(`The captions were not matched: ${error.message}`);
    }
    setBusy(null);
  };

  const startRecording = async () => {
    setProblem(null);
    try {
      takeRef.current = await recordVoice();
      setRecordedSeconds(0);
      setBusy('recording');
    } catch {
      setProblem('The microphone is blocked. Allow it from the address bar, then record again.');
    }
  };

  const stopRecording = async () => {
    const file = await takeRef.current.stop();
    takeRef.current = null;
    await takeFile(file, true);
  };

  const fitClips = () => {
    lengthsToFit(clips, track.duration).forEach((length, i) => {
      const end = endForLength(clips[i], length);
      // A cut-out part the new end mark no longer reaches has nothing left to cut.
      dispatch({ type: 'updateClip', id: clips[i].id, patch: { end, cuts: clips[i].cuts.filter((cut) => cut.to < end) } });
    });
  };

  const total = clips.reduce((sum, clip) => sum + clipLength(clip), 0);

  // The words arrive a few at a time and are shown as they come.
  const writeIt = async () => {
    const before = script;
    const control = new AbortController();
    writerRef.current = control;
    setWriting(true);
    setProblem(null);
    try {
      const text = await writeScript({
        title,
        format,
        outline,
        seconds: total,
        model: ai.model,
        signal: control.signal,
        onText: (value) => dispatch({ type: 'script', value }),
      });
      dispatch({ type: 'script', value: text });
      setReplaced(before.trim() ? before : null);
    } catch (error) {
      // Stopping keeps what was written so far; a failure puts the old script back.
      if (error.name !== 'AbortError') {
        dispatch({ type: 'script', value: before });
        setProblem(`The script was not written: ${error.message}`);
      } else {
        setReplaced(before.trim() ? before : null);
      }
    }
    setWriting(false);
  };

  const words = script.split(/\s+/).filter(Boolean).length;
  const mismatch = track && clips.length > 0 && Math.abs(total - track.duration) > 0.5;
  const working = busy !== null;
  const listened = Boolean(track?.words?.length);
  const captionsReady = Boolean(track) && (words > 0 || listened);

  return (
    <section className="step" aria-labelledby="step-sound">
      <StepHeading
        number={4}
        id="step-sound"
        title="Add a voice, music and captions"
        hint="Optional. A voice of your own is also what YouTube looks for when it decides whether videos made from clips can earn."
      />

      <div className="field">
        <label htmlFor="script">Script</label>
        <textarea
          id="script"
          className="script-input"
          rows={4}
          maxLength={MAX_SCRIPT}
          value={script}
          readOnly={writing}
          placeholder="Ever notice the tiny hole at the bottom of your airplane window? That is not damage."
          onChange={(e) => dispatch({ type: 'script', value: e.target.value })}
        />
        <p className="field-note">
          The words said in the video, used to make the voice and to write the captions.
          {words > 0 && ` ${words} words, about ${formatTime(words / WORDS_PER_SECOND)} spoken.`}
        </p>
        {ai.status === 'ready' && (
          <div className="script-ai">
            {writing ? (
              <button type="button" className="btn" onClick={() => writerRef.current?.abort()}>
                <Square size={16} aria-hidden="true" />
                Stop writing
              </button>
            ) : (
              <button type="button" className="btn" disabled={working || !title.trim()} onClick={writeIt}>
                <Sparkles size={18} aria-hidden="true" />
                {script.trim() ? 'Write it again with AI' : 'Write the script with AI'}
              </button>
            )}
            {replaced !== null && !writing && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  dispatch({ type: 'script', value: replaced });
                  setReplaced(null);
                }}
              >
                Bring back my script
              </button>
            )}
            <p className="field-note">
              Writes about {scriptWords(total)} words from your title{outline.length > 0 ? ' and clip names' : ''}. Change
              it until it says what you think: narration that could be on any channel is what YouTube’s rules on
              reused content are aimed at.
            </p>
          </div>
        )}
      </div>

      {track && (
        <div className="track">
          <FileAudio size={20} aria-hidden="true" />
          <span className="track-name">{track.fileName}</span>
          <span className="clip-time">{formatTime(track.duration)}</span>
          <button type="button" className="icon-btn danger" aria-label="Remove the sound" onClick={removeTrack}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="sound-sources">
        <div className="voice-maker">
          <div className="field">
            <label htmlFor="voice">Free voice ({VOICE_COUNT} to choose from)</label>
            <select id="voice" className="select" value={audio.voice} onChange={(e) => setAudio({ voice: e.target.value })}>
              {VOICE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}{voice.note ? ` (${voice.note})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Slider label="Speaking speed" value={Math.round(audio.speed * 100)} min={80} max={130} unit="%" onChange={(value) => setAudio({ speed: value / 100 })} />
          <button type="button" className="btn btn-primary" disabled={working || writing || words === 0} onClick={makeVoice}>
            <Sparkles size={18} aria-hidden="true" />
            {track ? 'Make the voiceover again' : 'Make the voiceover'}
          </button>
          <p className="field-note">
            {words === 0
              ? 'Write the script above to make a voice.'
              : 'Runs on this device and costs nothing. The first time, it downloads the voice model (about 90 MB).'}
          </p>
        </div>

        <div className="sound-buttons">
          {recording ? (
            <button type="button" className="btn btn-recording" onClick={stopRecording}>
              <Square size={16} aria-hidden="true" />
              Stop recording ({formatTime(recordedSeconds)})
            </button>
          ) : (
            <button type="button" className="btn" disabled={working} onClick={startRecording}>
              <Mic size={18} aria-hidden="true" />
              Record your voice
            </button>
          )}
          <button type="button" className="btn" disabled={working} onClick={() => fileRef.current.click()}>
            <FileAudio size={18} aria-hidden="true" />
            Add a voice file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
            hidden
            onChange={(e) => {
              if (e.target.files[0]) takeFile(e.target.files[0], false);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {working && !recording && <p className="status" role="status">{busy}</p>}
      {problem && <p className="notice" role="alert">{problem}</p>}

      <div className="volume-row">
        <Slider label="Clip sound" value={Math.round(audio.clipVolume * 100)} min={0} max={100} unit="%" onChange={(value) => setAudio({ clipVolume: value / 100 })} />
        {track && (
          <Slider label="Voice" value={Math.round(audio.trackVolume * 100)} min={0} max={100} unit="%" onChange={(value) => setAudio({ trackVolume: value / 100 })} />
        )}
      </div>

      {mismatch && (
        <p className="hint-warning" role="status">
          The sound is {formatTime(track.duration)} and the clips add up to {formatTime(total)}.{' '}
          {total < track.duration ? 'The video ends when the clips do, so the sound is cut off.' : 'The end of the video plays without it.'}{' '}
          <button type="button" className="link-btn" onClick={fitClips}>Fit the clips to the sound</button>
        </p>
      )}

      <details className="more">
        <summary>Clip sound and background music</summary>
        <div className="more-body">
          <div className="field">
            <Select
              label={format === 'quiz' ? 'Sound when the answer appears' : 'Sound when the next clip starts'}
              options={SOUNDS}
              value={audio.sfx}
              onChange={(sfx) => {
                setAudio({ sfx });
                onSound(sfx);
              }}
            />
            <p className="field-note">Off unless you pick one. Picking a sound plays it once so you can hear it.</p>
          </div>
          {audio.sfx !== 'none' && (
            <Slider label="Clip sound volume" value={Math.round(audio.sfxVolume * 100)} min={10} max={100} unit="%" onChange={(value) => setAudio({ sfxVolume: value / 100 })} />
          )}

          {music ? (
            <>
              <div className="track">
                <Music size={20} aria-hidden="true" />
                <span className="track-name">{music.fileName}</span>
                <span className="clip-time">{formatTime(music.duration)}</span>
                <button type="button" className="icon-btn danger" aria-label="Remove the music" onClick={removeMusic}>
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <Slider label="Music volume" value={Math.round(audio.musicVolume * 100)} min={0} max={100} unit="%" onChange={(value) => setAudio({ musicVolume: value / 100 })} />
              <Toggle
                label="Lower the music while the voice speaks"
                hint="The music drops under the words and comes back up in the pauses. It needs a voice from above."
                checked={audio.duck}
                onChange={(duck) => setAudio({ duck })}
              />
              <p className="field-note">
                The music starts with the video, repeats if it is shorter, and fades out over the last second. Only use
                music you are allowed to post.
              </p>
            </>
          ) : (
            <div className="field">
              <button type="button" className="btn" disabled={working} onClick={() => musicRef.current.click()}>
                <Music size={18} aria-hidden="true" />
                Add background music
              </button>
              <p className="field-note">Plays under the whole video, behind the clips and the voice.</p>
            </div>
          )}
          <input
            ref={musicRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
            hidden
            onChange={(e) => {
              if (e.target.files[0]) takeMusic(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </div>
      </details>

      <details className="more">
        <summary>Captions</summary>
        <div className="more-body">
          <Toggle
            label="Show captions"
            hint={
              captionsReady
                ? listened
                  ? 'Words appear as they are spoken, timed from listening to the voice.'
                  : 'Words appear as they are spoken. The timing is worked out from the pauses in the voice, so check it in the preview.'
                : 'Captions need both a script and a voice.'
            }
            checked={style.captionsOn}
            onChange={(captionsOn) => setStyle({ captionsOn })}
          />
          <div className="field">
            <button type="button" className="btn" disabled={!track || working || writing} onClick={matchCaptions}>
              <Ear size={18} aria-hidden="true" />
              {listened ? 'Listen to the voice again' : 'Match the captions to the voice'}
            </button>
            <p className="field-note">
              {track
                ? 'Listens to the voice on this device and times every word from it. English only. The first time, it downloads a listening model (about 60 MB). With no script, what it hears becomes the script.'
                : 'Add a voice first. This listens to it and times every word.'}
            </p>
          </div>
          <div className="field">
            <span className="field-label">Caption style</span>
            <Segmented label="Caption style" options={CAPTION_PRESETS} value={style.captionPreset} onChange={(captionPreset) => setStyle({ captionPreset })} />
          </div>
          <Slider label="Caption size" value={style.captionSize} min={44} max={120} unit=" px" onChange={(captionSize) => setStyle({ captionSize })} />
          <Slider label="Words at a time" value={style.captionWords} min={1} max={6} unit="" onChange={(captionWords) => setStyle({ captionWords })} />
          <Slider label="Distance from the top" value={style.captionHeight} min={25} max={80} unit="%" onChange={(captionHeight) => setStyle({ captionHeight })} />
        </div>
      </details>
    </section>
  );
}
