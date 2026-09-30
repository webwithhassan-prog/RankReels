// Client-side HTML5 Canvas + MediaRecorder video generator
// Zero servers, zero paid APIs, 100% free browser compilation!

export function startCanvasRecording(canvas, onProgress, onComplete, onError) {
  try {
    const stream = canvas.captureStream(30); // 30 FPS stream
    let mimeType = 'video/webm;codecs=vp9';

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 4500000 // 4.5 Mbps HD quality
    });

    const recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      if (onComplete) {
        onComplete(url, blob);
      }
    };

    mediaRecorder.onerror = (e) => {
      if (onError) onError(e);
    };

    mediaRecorder.start(250); // Record in 250ms chunks
    return mediaRecorder;
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}

export function downloadVideoBlob(blobUrl, filename = 'RankReel-viral-video.webm') {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }, 100);
}
