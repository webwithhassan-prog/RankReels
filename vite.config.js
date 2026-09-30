import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import feeds from './feeds.server.js'

// Browsers only let a page use several threads when it is "cross-origin isolated", which these two
// headers switch on. The voice model runs several times faster with them. Without them it still
// works, on one thread. The same headers are in public/_headers for hosts that read that file.
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

// /n8n/<name> reaches the n8n workflows running on this computer (n8n/*.json), for example the one that asks
// Gemini for ideas. Going through this server keeps them on the page's own address, so no CORS setup is needed.
const n8n = {
  '/n8n': { target: 'http://localhost:5678', rewrite: (path) => path.replace(/^\/n8n/, '/webhook') },
}

// https://vite.dev/config/
export default defineConfig({
  // feeds() serves /feeds/trends and /feeds/news, the fresh input for the idea helper.
  plugins: [react(), feeds()],
  server: { headers: isolation, proxy: n8n },
  preview: { headers: isolation, proxy: n8n },
  // The voice worker loads the speech model in pieces, which needs an ES module worker.
  worker: { format: 'es' },
})
