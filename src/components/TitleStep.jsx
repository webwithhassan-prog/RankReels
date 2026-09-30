import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { suggestTitles } from '../studio/ideas.js';
import {
  FONTS,
  HIGHLIGHT_COLORS,
  MAX_TITLE,
  OUTLINE_COLORS,
  TEXT_COLORS,
  titleWords,
  wordKey,
} from '../studio/project.js';
import { Slider, StepHeading, Swatches } from './controls.jsx';

export default function TitleStep({ ai, title, highlights, style, format, dispatch }) {
  const words = titleWords(title);
  const setStyle = (patch) => dispatch({ type: 'style', patch });
  const [options, setOptions] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [problem, setProblem] = useState(null);
  const run = useRef(null);

  useEffect(() => () => run.current?.abort(), []);

  const suggest = async () => {
    const control = new AbortController();
    run.current = control;
    setThinking(true);
    setProblem(null);
    try {
      setOptions(await suggestTitles({ title, format, model: ai.model, signal: control.signal }));
    } catch (error) {
      if (error.name !== 'AbortError') setProblem(`No titles came back: ${error.message}`);
    }
    setThinking(false);
  };

  return (
    <section className="step" aria-labelledby="step-title">
      <StepHeading
        number={2}
        id="step-title"
        title="Write the title"
        hint="Two lines read best. Press Enter where the second line should start."
      />

      <div className="field">
        <label htmlFor="title">Title</label>
        <textarea
          id="title"
          className="title-input"
          rows={2}
          value={title}
          placeholder="Ranking best football moments"
          onChange={(e) => dispatch({ type: 'title', value: e.target.value })}
        />
        <p className="field-note">{title.length} of {MAX_TITLE} characters</p>
      </div>

      {ai.status === 'ready' && (
        <div className="field">
          <button type="button" className="btn" disabled={thinking || !title.trim()} onClick={suggest}>
            <Sparkles size={18} aria-hidden="true" />
            {thinking ? 'Thinking of titles…' : 'Suggest other titles'}
          </button>
          {options.length > 0 && (
            <div className="chips suggestions" role="group" aria-label="Suggested titles">
              {options.map((option) => (
                <button
                  key={option.title}
                  type="button"
                  className="chip idea"
                  aria-pressed={option.title === title}
                  onClick={() => dispatch({ type: 'titleIdea', ...option })}
                >
                  {option.title.replace('\n', ' ')}
                </button>
              ))}
            </div>
          )}
          {problem && <p className="notice" role="alert">{problem}</p>}
        </div>
      )}

      {words.length > 0 && (
        <div className="field">
          <span className="field-label" id="keywords-label">Tap the words that say what the video is about</span>
          <div className="chips" role="group" aria-labelledby="keywords-label">
            {words.map((word, i) => {
              const key = wordKey(word);
              return (
                <button
                  key={`${i}-${word}`}
                  type="button"
                  className="chip"
                  aria-pressed={highlights.includes(key)}
                  style={{ '--chip': style.highlightColor }}
                  onClick={() => dispatch({ type: 'toggleHighlight', key })}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Swatches
        label="Highlight color"
        colors={HIGHLIGHT_COLORS}
        value={style.highlightColor}
        onChange={(highlightColor) => setStyle({ highlightColor })}
      />

      <details className="more">
        <summary>Font, size and outline</summary>
        <div className="more-body">
          <fieldset className="field">
            <legend>Font</legend>
            <div className="font-row">
              {FONTS.map((font) => (
                <label key={font.id} className="font-option" style={{ fontFamily: `"${font.id}"`, fontWeight: font.weight }}>
                  <input
                    type="radio"
                    name="title-font"
                    checked={style.font === font.id}
                    onChange={() => setStyle({ font: font.id })}
                  />
                  <span>{font.id}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Slider label="Title size" value={style.titleSize} min={48} max={140} unit=" px" onChange={(titleSize) => setStyle({ titleSize })} />
          <Slider label="Outline width" value={style.strokeWidth} min={0} max={18} unit=" px" onChange={(strokeWidth) => setStyle({ strokeWidth })} />
          <Swatches label="Outline color" colors={OUTLINE_COLORS} value={style.strokeColor} onChange={(strokeColor) => setStyle({ strokeColor })} />
          <Swatches label="Text color" colors={TEXT_COLORS} value={style.textColor} onChange={(textColor) => setStyle({ textColor })} />
        </div>
      </details>
    </section>
  );
}
