# AI ideas, titles and scripts

The editor can plan a video from one line of text, suggest other titles and write the voiceover
script. All three run on [Ollama](https://ollama.com), a free program that runs language models on
your own computer. There is no account, no key and no paid service.

## What it needs

- Ollama running on the same computer (it listens on `http://localhost:11434`).
- At least one model installed. The editor lists the installed models under **AI settings** in the
  idea box and uses the first one until you pick another.
- The editor opened from `localhost` (the dev or preview server). Ollama only answers pages from
  `localhost` unless its `OLLAMA_ORIGINS` setting says otherwise.

If Ollama is not running, the idea box says so and offers ready-made titles instead. The other two
buttons are hidden.

## Where "recent" comes from

A local model only knows what it was trained on. `llama3.1:8b`, for example, stops at the end of
2023. Two free feeds give it something newer:

| Feed | Used for | Source |
|---|---|---|
| Trending searches today (US) | The topic chips in the idea box | Google Trends RSS |
| Headlines from the last 7 days about your topic | Extra lines in the request to the model | Google News RSS |

Browsers are not allowed to read these feeds directly, so `feeds.server.js` adds two addresses to
the dev and preview servers (`/feeds/trends` and `/feeds/news?q=...`) that fetch them. Your topic is
sent to Google for the headline search. Turn this off under **AI settings**. On a static host there
is no such server, and ideas then come from the model alone.

The headlines help most when the topic is itself in the news (a player, a film, a match). For broad
topics such as "street food" they are mostly local news and the model is told to ignore them.

## Speed

The model runs on the processor, so the size of the model decides the wait. Measured on this laptop
on 30 September 2026 with `llama3.1:8b`:

| Request | Time |
|---|---|
| Three ideas, first request after starting | about 110 s, first idea after about 70 s |
| Three ideas, model already warmed up | about 90 s, first idea after about 40 s |
| A 70-word script | about 50 s |

The idea box warms the model up when you click into the topic field, which is where the 30 seconds
are saved. A smaller model is the bigger win: a 3B model has under half the work per word. To try
one:

```bash
ollama pull llama3.2:3b
```

Then pick it under **AI settings**. Smaller models are faster but make more mistakes.

## What to check before posting

- Names, scores and events in an idea can be wrong. The model guesses; it does not look things up.
- The script is a first draft. YouTube's rules on reused and inauthentic content are aimed at
  narration that could sit on any channel, so change it until it says what you think.
