import { useState } from 'react';
import { DEFAULT_PRESETS, loadPresets, presetFrom, savePresets } from '../studio/presets.js';

// Picks a channel, which sets the look, format and sound saved for it. Changes can be saved back.
export default function ChannelBar({ project, dispatch }) {
  const [presets, setPresets] = useState(loadPresets);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const current = presets.find((preset) => preset.id === project.channel);

  const store = (list) => {
    setPresets(list);
    savePresets(list);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveNew = (event) => {
    event.preventDefault();
    const label = name.trim();
    if (!label) return;
    const id = `channel-${Date.now().toString(36)}`;
    store([...presets, presetFrom(project, id, label)]);
    dispatch({ type: 'channel', id });
    setNaming(false);
    setName('');
  };

  const builtIn = current && DEFAULT_PRESETS.some((preset) => preset.id === current.id);

  return (
    <div className="channel-bar">
      <label htmlFor="channel">Channel</label>
      <select
        id="channel"
        className="select"
        value={current?.id ?? ''}
        onChange={(event) => {
          const preset = presets.find((item) => item.id === event.target.value);
          dispatch(preset ? { type: 'applyPreset', preset } : { type: 'channel', id: null });
        }}
      >
        <option value="">No channel</option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>{preset.name}</option>
        ))}
      </select>
      {current && (
        <button type="button" className="link-btn" onClick={() => store(presets.map((preset) => (preset.id === current.id ? presetFrom(project, preset.id, preset.name) : preset)))}>
          Save changes to {current.name}
        </button>
      )}
      {naming ? (
        <form className="channel-name" onSubmit={saveNew}>
          <input type="text" value={name} maxLength={40} placeholder="Channel name" aria-label="New channel name" onChange={(event) => setName(event.target.value)} />
          <button type="submit" className="link-btn" disabled={!name.trim()}>Save</button>
          <button type="button" className="link-btn" onClick={() => setNaming(false)}>Cancel</button>
        </form>
      ) : (
        <button type="button" className="link-btn" onClick={() => setNaming(true)}>Save as a new channel</button>
      )}
      {current && !builtIn && (
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            store(presets.filter((preset) => preset.id !== current.id));
            dispatch({ type: 'channel', id: null });
          }}
        >
          Remove {current.name}
        </button>
      )}
      {saved && <span className="saved-note" role="status">Saved</span>}
    </div>
  );
}
