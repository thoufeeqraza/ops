import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { config } from './config.js';
import { requestLogger, rateLimit } from './middleware.js';
import {
  getSource,
  getAllSources,
  getActions,
  patchAction,
} from './controllers.js';
import { getStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(cors({ origin: config.corsOrigin, credentials: true }));

// --- Health check (used by the deploy host) ---
app.get('/api/health', async (_req, res) => {
  const store = await getStore();
  res.json({ status: 'ok', store: store.kind, time: new Date().toISOString() });
});

// --- API gateway: everything under /api is rate-limited ---
const api = express.Router();
api.use(rateLimit({ windowMs: 60_000, max: 120 }));
api.get('/sources', getAllSources);
api.get('/sources/:id', getSource);
api.get('/actions', getActions);
api.patch('/actions/:id', patchAction);
app.use('/api', api);

// --- Serve the built frontend in production (single deploy) ---
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Connect the store up front so the first request isn't slowed by the handshake,
// and so we log which backend is active. getStore() degrades to in-memory if
// MONGO_URI is unreachable, so the server still boots either way.
const store = await getStore();

app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port} (store: ${store.kind})`);
  console.log(`[server] health: http://localhost:${config.port}/api/health`);
});
