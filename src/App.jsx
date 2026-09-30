import { useMemo, useRef, useState } from 'react';
import ClipsStep from './components/ClipsStep.jsx';
import ExportDialog from './components/ExportDialog.jsx';
import FinishStep from './components/FinishStep.jsx';
import FormatStep from './components/FormatStep.jsx';
import Guide from './components/Guide.jsx';
import IdeaStep from './components/IdeaStep.jsx';
import ChannelBar from './components/ChannelBar.jsx';
import VideoLibrary from './components/VideoLibrary.jsx';
import { stashCurrent } from './studio/library.js';
import OrderStep from './components/OrderStep.jsx';
import Preview from './components/Preview.jsx';
import SoundStep from './components/SoundStep.jsx';
import TitleStep from './components/TitleStep.jsx';
import { useAi } from './studio/ai.js';
import { disposeTrack } from './studio/audioTrack.js';
import { captionLines, timeWords } from './studio/captions.js';
import { disposeClip } from './studio/clips.js';
import { outlineFor } from './studio/ideas.js';
import { clipLength, playbackOrder, useProject } from './studio/project.js';
import { usePlayer } from './studio/usePlayer.js';

export default function App() {
  const [project, dispatch, storageProblem] = useProject();
  const { title, highlights, style, format, script, audio, plan, clips, track, music, customOrder, restore, lost } = project;
  const canvasRef = useRef(null);
  const ai = useAi();

  const order = useMemo(() => playbackOrder(project), [project]);
  const words = useMemo(() => timeWords(script, track), [script, track]);
  const captions = useMemo(() => captionLines(words, style.captionWords), [words, style.captionWords]);
  const outline = useMemo(() => outlineFor({ format, clips, order, plan }), [format, clips, order, plan]);
  // The clips that take up time, in the order they play. In a this-or-that video that is one of each pair.
  const playing = useMemo(() => order.map((id) => clips.find((clip) => clip.id === id)).filter(Boolean), [clips, order]);
  const total = playing.reduce((sum, clip) => sum + clipLength(clip), 0);

  const player = usePlayer(canvasRef, { title, highlights, style, format, clips, order, captions, total, track, music, audio });

  // Bumped when a video is put aside, so the list of saved videos reads itself again.
  const [shelf, setShelf] = useState(0);

  // The open video is kept in My videos, then the editor starts empty.
  const startNew = () => {
    stashCurrent();
    setShelf((count) => count + 1);
    player.pause();
    dispatch({ type: 'reset' });
    clips.forEach(disposeClip);
    if (track) disposeTrack(track);
    if (music) disposeTrack(music);
  };

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1>RankReel</h1>
          <p>Turn a handful of clips into a vertical video for Shorts, Reels and TikTok.</p>
        </div>
        <VideoLibrary key={shelf} onNew={startNew} />
      </header>

      <main className="editor">
        <Guide project={project} />
        <ChannelBar project={project} dispatch={dispatch} />
        <IdeaStep ai={ai} title={title} format={format} channel={project.channel} dispatch={dispatch} />
        <FormatStep format={format} title={title} style={style} dispatch={dispatch} />
        <TitleStep ai={ai} title={title} highlights={highlights} style={style} format={format} dispatch={dispatch} />
        <ClipsStep
          clips={clips}
          format={format}
          plan={plan}
          total={total}
          restoring={Boolean(restore)}
          lost={lost}
          storageProblem={storageProblem}
          dispatch={dispatch}
          onScrub={player.scrub}
          onPreview={(id, time) => {
            player.scrub(id, time);
            player.play();
          }}
        />
        <SoundStep
          ai={ai}
          title={title}
          outline={outline}
          script={script}
          track={track}
          music={music}
          audio={audio}
          style={style}
          clips={playing}
          format={format}
          dispatch={dispatch}
          onSound={player.previewSound}
        />
        <OrderStep clips={clips} order={order} customOrder={customOrder} format={format} style={style} dispatch={dispatch} />
        <FinishStep ai={ai} canvasRef={canvasRef} project={project} hasClips={clips.length > 0} />
      </main>

      <aside className="stage-wrap" aria-label="Preview and export">
        <Preview
          canvasRef={canvasRef}
          player={player}
          clips={clips}
          order={order}
          total={total}
          onFrame={(id, patch) => dispatch({ type: 'updateClip', id, patch })}
        />
      </aside>

      <ExportDialog state={player.exportState} title={title} onCancel={player.cancelExport} onClose={player.closeExport} />
    </div>
  );
}
