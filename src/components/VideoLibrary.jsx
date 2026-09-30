import { useState } from 'react';
import { FilePlus2, X } from 'lucide-react';
import { deleteVideo, listVideos, openVideo } from '../studio/library.js';
import ChannelScores from './ChannelScores.jsx';

function titleOf(video) {
  return video.draft.title?.replace(/\s+/g, ' ').trim() || 'Untitled video';
}

function savedWhen(time) {
  return new Date(time).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

// "New video" puts the open video on the list instead of throwing it away, so nothing is lost.
export default function VideoLibrary({ onNew }) {
  const [videos, setVideos] = useState(listVideos);

  return (
    <div className="library">
      <button type="button" className="btn" onClick={onNew}>
        <FilePlus2 size={18} aria-hidden="true" />
        New video
      </button>
      <details className="library-list" onToggle={() => setVideos(listVideos())}>
        <summary className="btn">My videos ({videos.length})</summary>
        <div className="library-panel">
          {videos.length === 0 ? (
            <p className="field-note">When you start a new video, the one you were on is kept here.</p>
          ) : (
            <ul>
              {videos.map((video) => (
                <li key={video.id}>
                  <span>
                    <strong>{titleOf(video)}</strong>
                    <small>{video.draft.clips?.length ?? 0} clips, saved {savedWhen(video.savedAt)}</small>
                  </span>
                  <button type="button" className="btn" onClick={() => openVideo(video.id)}>Open</button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Delete ${titleOf(video)}`}
                    onClick={() => {
                      deleteVideo(video.id);
                      setVideos(listVideos());
                    }}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
      <ChannelScores />
    </div>
  );
}
