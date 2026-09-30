// Gives the idea helper something newer than a language model's training: today's trending searches
// and this week's headlines about a topic. Both are public Google RSS feeds that a browser is not
// allowed to read directly, so the dev and preview servers fetch them and hand back plain JSON.
// A static host has no such server; the idea helper then works without the news.
const TRENDS_URL = 'https://trends.google.com/trending/rss?geo=US';
const newsUrl = (topic) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${topic} when:7d`)}&hl=en-US&gl=US&ceid=US:en`;

const KEEP_MS = 10 * 60 * 1000;
const MAX_TOPIC = 80;
const cache = new Map();

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code) => {
      if (code[0] !== '#') return ENTITIES[code] ?? match;
      const hex = code[1] === 'x' || code[1] === 'X';
      return String.fromCodePoint(parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
    })
    .trim();
}

function tag(xml, name) {
  const found = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return found ? decode(found[1]) : '';
}

async function readItems(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.items;
  const response = await fetch(url, { headers: { 'User-Agent': 'RankReel idea helper (local)' } });
  if (!response.ok) throw new Error(`The feed answered ${response.status}.`);
  const items = (await response.text()).match(/<item>[\s\S]*?<\/item>/g) ?? [];
  cache.set(url, { at: Date.now(), items });
  if (cache.size > 40) cache.delete(cache.keys().next().value);
  return items;
}

async function trends() {
  const items = await readItems(TRENDS_URL);
  return items.slice(0, 12).map((item) => ({ title: tag(item, 'title'), searches: tag(item, 'ht:approx_traffic') }));
}

async function news(topic) {
  const items = await readItems(newsUrl(topic));
  const seen = new Set();
  return items
    .map((item) => ({
      // Google News appends the publisher to every headline.
      title: tag(item, 'title').replace(/\s+-\s+[^-]+$/, ''),
      date: tag(item, 'pubDate'),
    }))
    .filter((item) => item.title && !seen.has(item.title) && seen.add(item.title))
    .slice(0, 10);
}

async function handle(request, response) {
  const url = new URL(request.url, 'http://local');
  const send = (status, body) => {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(body));
  };
  try {
    if (url.pathname === '/trends') return send(200, { items: await trends() });
    if (url.pathname === '/news') {
      const topic = (url.searchParams.get('q') ?? '').trim().slice(0, MAX_TOPIC);
      if (!topic) return send(400, { error: 'Give a topic in q.' });
      return send(200, { items: await news(topic) });
    }
    return send(404, { error: 'No such feed.' });
  } catch (error) {
    return send(502, { error: String(error?.message || error) });
  }
}

export default function feeds() {
  return {
    name: 'rankreel-feeds',
    configureServer(server) {
      server.middlewares.use('/feeds', handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/feeds', handle);
    },
  };
}
