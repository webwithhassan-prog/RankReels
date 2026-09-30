import { FORMATS, formatById } from '../studio/formats.js';
import { LOOKS } from '../studio/project.js';
import { StepHeading } from './controls.jsx';

export default function FormatStep({ format, title, style, dispatch }) {
  const current = formatById(format);

  const wearing = (look) => Object.entries(look.patch).every(([key, value]) => style[key] === value);

  return (
    <section className="step" aria-labelledby="step-format">
      <StepHeading
        number={1}
        id="step-format"
        title="Pick a format"
        hint="Each format gives viewers a different reason to watch to the end. You can switch at any time without losing your clips."
      />

      <fieldset className="field">
        <legend className="visually-hidden">Format</legend>
        <div className="format-grid">
          {FORMATS.map((option) => (
            <label key={option.id} className="format-card">
              <input type="radio" name="format" checked={option.id === format} onChange={() => dispatch({ type: 'format', format: option.id })} />
              <span>
                <strong>{option.name}</strong>
                <small>{option.blurb}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <span className="field-label" id="ideas-label">Start from a title that fits {current.name.toLowerCase()}</span>
        <div className="chips" role="group" aria-labelledby="ideas-label">
          {current.ideas.map((idea) => (
            <button
              key={idea.title}
              type="button"
              className="chip idea"
              aria-pressed={idea.title === title}
              onClick={() => dispatch({ type: 'titleIdea', ...idea })}
            >
              {idea.title.replace('\n', ' ')}
            </button>
          ))}
        </div>
      </div>

      <fieldset className="field">
        <legend>Look</legend>
        <div className="look-row">
          {LOOKS.map((look) => (
            <label
              key={look.id}
              className="look"
              style={{ '--bg': look.patch.background, '--ink': look.patch.textColor, '--accent': look.patch.highlightColor, fontFamily: `"${look.patch.font}"` }}
            >
              <input
                type="radio"
                name="look"
                checked={wearing(look)}
                onChange={() => dispatch({ type: 'style', patch: look.patch })}
              />
              <span>
                {look.name}
                <i aria-hidden="true" />
              </span>
            </label>
          ))}
        </div>
        <p className="field-note">A look sets the colors, font and outline together. Fine-tune them in step 2.</p>
      </fieldset>
    </section>
  );
}
