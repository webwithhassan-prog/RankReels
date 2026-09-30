import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Lightbulb, Sparkles, Square } from 'lucide-react';
import { GEMINI } from '../studio/ai.js';
import { fetchDaily } from '../studio/daily.js';
import { loadPresets } from '../studio/presets.js';
import { formatById } from '../studio/formats.js';
import { IDEA_COUNT, IDEA_FORMATS, MAX_TOPIC, STARTER_TOPICS, fetchHeadlines, fetchTrending, prepare, readIdea, readyMadeIdeas, suggestIdeas } from '../studio/ideas.js';
import { Toggle } from './controls.jsx';

const ANY_FORMAT = '';
const OPEN_KEY = 'rankreel.ideasOpen';

function wasOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === 'yes';
  } catch {
    return false;
  }
}

// An optional helper, so it starts folded to one line and stays out of the way of the steps.
export default function IdeaStep(props) {
  const [open, setOpen] = useState(wasOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, next ? 'yes' : 'no');
    } catch {
      // Storage can be blocked; the panel then starts folded next time.
    }
  };

  return (
    <section className="step idea-step" data-open={open} aria-labelledby="step-idea">
      <h2 className="idea-heading">
        <button type="button" id="step-idea" className="idea-toggle" aria-expanded={open} onClick={toggle}>
          <Lightbulb size={22} aria-hidden="true" />
          <span>
            <strong>Need an idea?</strong>
            <small>Get a format, a title and the clips to find from one topic.</small>
          </span>
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      </h2>
      {open && <IdeaHelper {...props} />}
    </section>
  );
}

// The ideas n8n wrote today: the open channel's when it has some, otherwise every channel's.
function todaysIdeas(daily, channel) {
  const today = new Date().toLocaleDateString('en-CA');
  const byChannel = daily?.ideas?.date === today ? daily.ideas.channels ?? {} : {};
  const names = Object.fromEntries(loadPresets().map((preset) => [preset.id, preset.name]));
  const read = (id) => (byChannel[id] ?? []).map(readIdea).filter(Boolean).map((idea) => ({ ...idea, channel: names[id] ?? id }));
  return byChannel[channel] ? read(channel) : Object.keys(byChannel).flatMap(read);
}

function IdeaHelper({ ai, title, format, channel, dispatch }) {
  const [daily, setDaily] = useState(null);
  const [topic, setTopic] = useState('');
  const [only, setOnly] = useState(ANY_FORMAT);
  const [ideas, setIdeas] = useState([]);
  // 'ai' for ideas from the model, 'ready' for the built-in titles shown when no model is running.
  const [source, setSource] = useState(null);
  const [phase, setPhase] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [headlines, setHeadlines] = useState([]);
  const [problem, setProblem] = useState(null);
  const [trending, setTrending] = useState([]);
  const run = useRef(null);

  useEffect(() => {
    let live = true;
    fetchTrending().then((list) => live && setTrending(list));
    fetchDaily().then((found) => live && setDaily(found));
    return () => {
      live = false;
      run.current?.abort();
    };
  }, []);

  const busy = phase !== null;
  useEffect(() => {
    if (!busy) return undefined;
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  const getIdeas = async (subject) => {
    const about = subject.trim();
    if (!about) return;
    run.current?.abort();
    setProblem(null);
    setHeadlines([]);
    if (ai.status !== 'ready') {
      setIdeas(readyMadeIdeas(about));
      setSource('ready');
      return;
    }
    const control = new AbortController();
    run.current = control;
    setIdeas([]);
    setSource('ai');
    setSeconds(0);
    try {
      let news = [];
      if (ai.news) {
        setPhase('news');
        news = await fetchHeadlines(about, control.signal);
        setHeadlines(news);
      }
      setPhase('thinking');
      const all = await suggestIdeas({ topic: about, format: only, headlines: news, model: ai.model, signal: control.signal, onIdeas: setIdeas });
      setIdeas(all);
      if (!all.length) setProblem('The model did not come back with a usable idea. Ask again, or pick another model under AI settings.');
    } catch (error) {
      if (error.name !== 'AbortError') setProblem(error.message);
    }
    // A newer request may already have taken over.
    if (run.current === control) {
      run.current = null;
      setPhase(null);
    }
  };

  const stop = () => {
    run.current?.abort();
    run.current = null;
    setPhase(null);
  };

  const start = (subject) => {
    setTopic(subject);
    getIdeas(subject);
  };

  const inUse = (idea) => idea.title === title && idea.format === format;
  const ready = todaysIdeas(daily, channel);

  return (
    <>
      {ready.length > 0 && (
        <div className="field">
          <span className="field-label">Ready for today</span>
          <ul className="ideas" aria-label="Ideas made today by n8n">
            {ready.map((idea) => (
              <li key={`${idea.channel}-${idea.title}`} className="idea-card" data-used={inUse(idea)}>
                <span className="idea-format">{idea.channel}: {formatById(idea.format).name}</span>
                <strong>{idea.title.replace('\n', ' ')}</strong>
                {idea.items.length > 0 && <span className="idea-items">Clips to find: {idea.items.join(', ')}</span>}
                <button type="button" className="btn" aria-pressed={inUse(idea)} onClick={() => dispatch({ type: 'applyIdea', idea })}>
                  {inUse(idea) && <Check size={18} aria-hidden="true" />}
                  {inUse(idea) ? 'In use' : 'Use this idea'}
                </button>
              </li>
            ))}
          </ul>
          <p className="field-note">Written today by n8n with Gemini, from this week’s news for each channel.</p>
        </div>
      )}

      <p className="idea-hint">
        Say what the video is about. You get ready-to-use plans: a format, a title and the clips to find. One click
        sets it all up.
      </p>

      <form
        className="idea-ask"
        onSubmit={(event) => {
          event.preventDefault();
          getIdeas(topic);
        }}
      >
        <div className="field">
          <label htmlFor="topic">What is the video about?</label>
          <input
            id="topic"
            type="text"
            value={topic}
            maxLength={MAX_TOPIC}
            placeholder="Football, street food, a new film, anything"
            onChange={(event) => setTopic(event.target.value)}
            onFocus={() => ai.status === 'ready' && prepare(ai.model)}
          />
        </div>
        <div className="field">
          <label htmlFor="idea-format">Ideas in</label>
          <select id="idea-format" className="select" value={only} onChange={(event) => setOnly(event.target.value)}>
            <option value={ANY_FORMAT}>a mix of formats</option>
            {IDEA_FORMATS.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>
        {busy ? (
          <button type="button" className="btn" onClick={stop}>
            <Square size={16} aria-hidden="true" />
            Stop
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={!topic.trim()}>
            <Sparkles size={18} aria-hidden="true" />
            Get ideas
          </button>
        )}
      </form>

      {ai.status === 'off' && (
        <p className="hint-warning">
          AI ideas come from Gemini through your n8n, or from Ollama on this computer, and neither is answering right
          now. Start n8n (with the RankReel AI workflow published) or Ollama, then{' '}
          <button type="button" className="link-btn" onClick={ai.check}>check again</button>. Until then you get
          ready-made titles.
        </p>
      )}
      {ai.status === 'empty' && (
        <p className="hint-warning">
          Ollama is running but has no model yet. In a terminal, run <code>ollama pull llama3.2:3b</code>, then{' '}
          <button type="button" className="link-btn" onClick={ai.check}>check again</button>.
        </p>
      )}

      {busy && (
        <p className="status" role="status">
          {phase === 'news'
            ? 'Reading this week’s headlines…'
            : ai.model === GEMINI
              ? `Gemini is writing ${IDEA_COUNT} ideas. ${seconds} s so far.`
              : `Writing idea ${Math.min(ideas.length + 1, IDEA_COUNT)} of ${IDEA_COUNT}. ${seconds} s so far. The model runs on this computer, so it takes a while.`}
        </p>
      )}
      {problem && <p className="notice" role="alert">{problem}</p>}

      {ideas.length > 0 && (
        <>
          <ul className="ideas" aria-label={source === 'ai' ? 'Ideas from the model' : 'Ready-made titles'}>
            {ideas.map((idea) => (
              <li key={`${idea.format}-${idea.title}`} className="idea-card" data-used={inUse(idea)}>
                <span className="idea-format">{formatById(idea.format).name}</span>
                <strong>{idea.title.replace('\n', ' ')}</strong>
                {idea.items.length > 0 && <span className="idea-items">Clips to find: {idea.items.join(', ')}</span>}
                <button type="button" className="btn" aria-pressed={inUse(idea)} onClick={() => dispatch({ type: 'applyIdea', idea })}>
                  {inUse(idea) && <Check size={18} aria-hidden="true" />}
                  {inUse(idea) ? 'In use' : 'Use this idea'}
                </button>
              </li>
            ))}
          </ul>
          <p className="field-note">
            {source === 'ready'
              ? 'These are ready-made titles, not written by AI. Using one sets the format and the title.'
              : 'Using an idea sets the format and the title, and lists its clips in step 3. Check the facts before you post: a model can get names and events wrong.'}
            {ideas.some(inUse) && <> Next, <a href="#step-clips">add your clips</a>.</>}
          </p>
          {headlines.length > 0 && (
            <details className="more">
              <summary>{headlines.length} headlines from this week were given to the model</summary>
              <ul className="headline-list">
                {headlines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <div className="topic-rows">
        {trending.length > 0 && (
          <div className="field">
            <span className="field-label" id="trending-label">Trending searches in the US today</span>
            <div className="chips" role="group" aria-labelledby="trending-label">
              {trending.map((name) => (
                <button key={name} type="button" className="chip topic" disabled={busy} onClick={() => start(name)}>{name}</button>
              ))}
            </div>
          </div>
        )}
        <div className="field">
          <span className="field-label" id="starters-label">Or start from a subject that always works</span>
          <div className="chips" role="group" aria-labelledby="starters-label">
            {STARTER_TOPICS.map((name) => (
              <button key={name} type="button" className="chip topic" disabled={busy} onClick={() => start(name)}>{name}</button>
            ))}
          </div>
        </div>
      </div>

      {ai.status === 'ready' && (
        <details className="more">
          <summary>AI settings</summary>
          <div className="more-body">
            <div className="field">
              <label htmlFor="ai-model">Model</label>
              <select id="ai-model" className="select" value={ai.model} onChange={(event) => ai.update({ pick: event.target.value })}>
                {ai.models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.label ?? model.name}{model.size ? ` (${model.size})` : ''}
                  </option>
                ))}
              </select>
              <p className="field-note">
                Gemini is Google’s model on its free tier. It answers in seconds, through your n8n, which keeps the
                key. The others are installed in Ollama on this computer: slower, but they work without n8n.
              </p>
            </div>
            <Toggle
              label="Use this week’s headlines"
              hint="Looks up your subject on Google News so ideas can be about things newer than the model knows. Your subject is sent to Google for this."
              checked={ai.news}
              onChange={(news) => ai.update({ news })}
            />
          </div>
        </details>
      )}
    </>
  );
}
