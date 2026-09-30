import { useCallback, useEffect, useState } from 'react';

// The idea helper runs on one of two free models:
// - Gemini, Google's model on its free tier, reached through the n8n workflow in n8n/rankreel-ai-gemini.json.
//   n8n keeps the Gemini key, so it never reaches the browser. Answers take seconds.
// - Ollama, a free program that runs language models on this computer. Slower, but needs nothing else.
const OLLAMA_URL = 'http://localhost:11434';
const GEMINI_URL = '/n8n/rankreel-ai';
export const GEMINI = 'gemini';
const SETTINGS_KEY = 'rankreel.ai';
// Loading a model takes a while, so it is kept in memory between requests.
const KEEP_LOADED = '30m';

// How many Gemini models the workflow can try in turn when one is busy. The workflow says so when checked.
let geminiTries = 1;

// `pick` is the chosen model. It replaced an older `model` setting, so that Gemini is the first choice once it is there.
function loadSettings() {
  try {
    return { pick: '', news: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { pick: '', news: true };
  }
}

// Asks the workflow whether it is on. This does not use up any of the free Gemini requests.
async function geminiIsOn() {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
    });
    if (!response.ok) return false;
    const { models } = await response.json();
    geminiTries = Math.max(1, Number(models) || 1);
    return true;
  } catch {
    return false;
  }
}

async function installedModels() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error(`Ollama answered ${response.status}.`);
  const { models = [] } = await response.json();
  return models
    // Embedding models cannot write text.
    .filter((model) => !/embed/i.test(model.name))
    .map((model) => ({ name: model.name, size: model.details?.parameter_size ?? '' }));
}

async function lookForModels() {
  const [gemini, local] = await Promise.all([geminiIsOn(), installedModels().catch(() => null)]);
  const models = [...(gemini ? [{ name: GEMINI, label: 'Gemini (free, through n8n)', size: '' }] : []), ...(local ?? [])];
  if (models.length) return { status: 'ready', models };
  return { status: local ? 'empty' : 'off', models };
}

// status: 'checking', 'ready', 'empty' (only Ollama runs, and it has no model) or 'off' (neither answers).
export function useAi() {
  const [settings, setSettings] = useState(loadSettings);
  const [found, setFound] = useState({ status: 'checking', models: [] });

  useEffect(() => {
    let live = true;
    lookForModels().then((next) => live && setFound(next));
    return () => {
      live = false;
    };
  }, []);

  const check = useCallback(() => lookForModels().then(setFound), []);

  const update = useCallback((patch) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // Storage can be blocked; the choice then lasts for this visit.
      }
      return next;
    });
  }, []);

  const chosen = found.models.some((model) => model.name === settings.pick) ? settings.pick : found.models[0]?.name ?? '';

  return { ...found, model: chosen, news: settings.news, update, check };
}

const warmed = new Set();

// Loads the model and has it read the fixed instructions ahead of the first request. Ollama keeps that
// work, so the first real answer starts much sooner.
export function warmUp(model, system) {
  const key = `${model}\n${system}`;
  if (!model || model === GEMINI || warmed.has(key)) return;
  warmed.add(key);
  fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      think: false,
      keep_alive: KEEP_LOADED,
      options: { num_predict: 1 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: 'Topic:' },
      ],
    }),
  }).catch(() => warmed.delete(key));
}

// Gemini's reply comes whole, not in pieces. A busy model is asked again, and the workflow then tries the next one.
async function askGemini({ system, prompt, schema, temperature, signal }) {
  let reply = null;
  for (let attempt = 0; attempt < geminiTries; attempt++) {
    let response;
    try {
      response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ attempt, system, prompt, schema, temperature }),
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error('n8n is not answering. Start it and try again.');
    }
    reply = await response.json().catch(() => null);
    if (response.ok && reply?.text) return reply.text;
    if (!reply?.busy) break;
  }
  throw new Error(reply?.error || 'Gemini did not answer. Check that the RankReel AI workflow is published in n8n.');
}

// Streams a reply from the model. `onText` gets the whole reply so far each time more arrives.
// With a `schema`, the reply is JSON held to that shape.
export async function generate({ model, system, prompt, schema, maxTokens, temperature = 0.8, signal, onText }) {
  if (model === GEMINI) {
    const text = await askGemini({ system, prompt, schema, temperature, signal });
    onText?.(text);
    return text;
  }
  let response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        stream: true,
        think: false,
        keep_alive: KEEP_LOADED,
        format: schema,
        options: { temperature, num_predict: maxTokens },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Ollama is not answering. Start it and try again.');
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.error || `Ollama answered ${response.status}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const part = JSON.parse(line);
      if (part.error) throw new Error(part.error);
      if (part.message?.content) {
        text += part.message.content;
        onText?.(text);
      }
    }
  }
  return text;
}
