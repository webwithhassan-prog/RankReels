import { useId } from 'react';

export function StepHeading({ number, id, title, hint }) {
  return (
    <header className="step-heading">
      <span className="step-number" aria-hidden="true">{number}</span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{hint}</p>
      </div>
    </header>
  );
}

export function Swatches({ label, colors, value, onChange }) {
  const name = useId();
  const current = value.toUpperCase();
  const custom = !colors.some((c) => c.value === current);
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="swatch-row">
        {colors.map((color) => (
          <label key={color.value} className="swatch" style={{ '--swatch': color.value }} title={color.name}>
            <input type="radio" name={name} checked={color.value === current} onChange={() => onChange(color.value)} />
            <span className="visually-hidden">{color.name}</span>
          </label>
        ))}
        <label className="swatch-custom" data-active={custom}>
          <input type="color" value={value.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())} />
          <span>Custom</span>
        </label>
      </div>
    </fieldset>
  );
}

export function Slider({ label, value, min, max, unit, onChange }) {
  const id = useId();
  return (
    <div className="field slider">
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id}>{value}{unit}</output>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span className="toggle-text">
        <strong>{label}</strong>
        <span>{hint}</span>
      </span>
    </label>
  );
}

export function Segmented({ label, options, value, onChange }) {
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">{label}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input type="radio" name={name} checked={option.value === value} onChange={() => onChange(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Select({ label, options, value, onChange }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
