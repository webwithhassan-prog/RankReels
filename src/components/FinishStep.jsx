import { useState } from 'react';
import { Check, Copy, ImageDown, Sparkles } from 'lucide-react';
import { outlineFor, writeUploadText } from '../studio/ideas.js';
import { uploadText } from '../studio/uploadText.js';
import { StepHeading } from './controls.jsx';

const FIELDS = [
  { key: 'title', label: 'Title', rows: 1 },
  { key: 'description', label: 'Description', rows: 4 },
  { key: 'hashtags', label: 'Hashtags', rows: 1 },
];

function fileName(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug || 'rankreel'}-cover.jpg`;
}

export default function FinishStep({ ai, canvasRef, project, hasClips }) {
  // What has been typed over the suggested text, or written by AI. A field left alone keeps following the video.
  const [edits, setEdits] = useState({});
  const [copied, setCopied] = useState(null);
  const [problem, setProblem] = useState(null);
  const [writing, setWriting] = useState(false);

  // Optional: the model writes all three fields at once. Going back to the suggested text undoes it.
  const writeWithAi = async () => {
    setWriting(true);
    setProblem(null);
    try {
      const { title, format, script } = project;
      const text = await writeUploadText({ title, format, script, outline: outlineFor(project), model: ai.model });
      setEdits(Object.fromEntries(Object.entries(text).filter(([, value]) => value)));
    } catch (error) {
      setProblem(error.message);
    }
    setWriting(false);
  };
  const suggested = uploadText(project);
  const valueOf = (key) => edits[key] ?? suggested[key];

  // The cover is the picture showing in the preview right now, at full size.
  const saveCover = () => {
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName(project.title);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      },
      'image/jpeg',
      0.92,
    );
  };

  const copy = async (key) => {
    try {
      await navigator.clipboard.writeText(valueOf(key));
      setCopied(key);
      setProblem(null);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
    } catch {
      setProblem('This browser did not allow copying. Select the text and copy it yourself.');
    }
  };

  const edited = Object.keys(edits).length > 0;

  return (
    <section className="step" aria-labelledby="step-finish">
      <StepHeading
        number={6}
        id="step-finish"
        title="Cover image and upload text"
        hint="Optional. A picture for the cover, and words to paste in when you upload to YouTube, TikTok or Instagram."
      />

      <div className="field">
        <button type="button" className="btn" disabled={!hasClips} onClick={saveCover}>
          <ImageDown size={18} aria-hidden="true" />
          Save the cover image
        </button>
        <p className="field-note">
          {hasClips
            ? 'Saves the picture showing in the preview now, at 1080 × 1920. Pause on the moment you want first.'
            : 'Add a clip first. The cover is a picture from the preview.'}
        </p>
      </div>

      {ai.status === 'ready' && (
        <div className="field">
          <button type="button" className="btn" disabled={writing} onClick={writeWithAi}>
            <Sparkles size={18} aria-hidden="true" />
            {writing ? 'Writing…' : 'Write it with AI'}
          </button>
          <p className="field-note">Optional. Writes a title, description and hashtags from your video in one go.</p>
        </div>
      )}

      {FIELDS.map((field) => (
        <div key={field.key} className="field">
          <label htmlFor={`upload-${field.key}`}>{field.label}</label>
          <div className="copy-field">
            <textarea
              id={`upload-${field.key}`}
              rows={field.rows}
              value={valueOf(field.key)}
              onChange={(event) => setEdits({ ...edits, [field.key]: event.target.value })}
            />
            <button type="button" className="btn" onClick={() => copy(field.key)}>
              {copied === field.key ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              {copied === field.key ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ))}

      {problem && <p className="notice" role="alert">{problem}</p>}
      <p className="field-note">
        Written from your title, format and clip names, and it follows them as they change. Make it your own before
        posting.{' '}
        {edited && (
          <button type="button" className="link-btn" onClick={() => setEdits({})}>Go back to the suggested text</button>
        )}
      </p>
    </section>
  );
}
