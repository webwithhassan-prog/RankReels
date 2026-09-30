import { Check } from 'lucide-react';

// The one thing to do next, so nobody has to work out where they are.
function nextMove({ clips, format, track, plan, restore }) {
  if (restore) return { step: null, text: 'Bringing back your clips…' };
  if (clips.length === 0) {
    return { step: 'step-clips', text: plan.items.length ? `Add the ${plan.items.length} clips from your idea` : 'Add your clips' };
  }
  const missing = plan.items.filter((item) => !clips.some((clip) => clip.name === item)).length;
  if (missing > 0) {
    return { step: 'step-clips', text: missing === 1 ? 'Add the last clip on your list' : `Add the ${missing} clips still on your list` };
  }
  if (format === 'story' && !track) return { step: 'step-sound', text: 'Add the voiceover' };
  if (format !== 'story' && clips.some((clip) => !clip.name.trim())) return { step: 'step-clips', text: 'Name your clips' };
  if (!track) return { step: 'step-sound', text: 'Add a voice if you want one, or export' };
  return { step: null, text: 'Ready. Press Export video' };
}

export default function Guide({ project }) {
  const { clips, title, track } = project;
  const next = nextMove(project);
  // `done` is left out for steps that are a free choice with nothing to finish.
  const steps = [
    { id: 'step-format', label: 'Format' },
    { id: 'step-title', label: 'Title', done: title.trim().length > 0 },
    { id: 'step-clips', label: clips.length ? `Clips (${clips.length})` : 'Clips', done: clips.length > 0 },
    { id: 'step-sound', label: 'Sound', done: Boolean(track) },
    { id: 'step-order', label: 'Order' },
    { id: 'step-finish', label: 'Post' },
  ];

  return (
    <nav className="guide" aria-label="Steps">
      <ol>
        {steps.map((step) => (
          <li key={step.id}>
            <a href={`#${step.id}`} data-done={Boolean(step.done)} aria-current={step.id === next.step ? 'step' : undefined}>
              {step.done && <Check size={14} aria-hidden="true" />}
              {step.label}
            </a>
          </li>
        ))}
      </ol>
      <p className="guide-next">
        <span>Next:</span> {next.step ? <a href={`#${next.step}`}>{next.text}</a> : next.text}
      </p>
    </nav>
  );
}
