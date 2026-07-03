import { cached } from './cache.js';
import { sources, sourceById } from './sources/index.js';
import { evaluateSource } from './triggers/engine.js';
import { listActions, updateActionStatus } from './actionQueue.js';

/**
 * Controllers hold the business logic; routes only wire them up.
 * Every source read goes through the cache (never a direct API call), and on
 * each fresh read the trigger rules are evaluated so breaches become actions.
 */

async function readSource(source) {
  const entry = await cached(source.id, source.ttl, () => source.fetch());
  // Evaluate triggers against whatever data we just served (fire-and-forget;
  // creation is idempotent so repeated evaluation is safe).
  evaluateSource(source, entry.data).catch((err) =>
    console.warn(`[triggers] ${source.id} eval failed: ${err.message}`),
  );
  return {
    id: source.id,
    title: source.title,
    widget: source.widget,
    question: source.question,
    lastUpdated: entry.lastUpdated,
    stale: entry.stale,
    error: entry.error,
    data: entry.data,
  };
}

export async function getSource(req, res) {
  const source = sourceById[req.params.id];
  if (!source) return res.status(404).json({ error: `Unknown source ${req.params.id}` });
  try {
    res.json(await readSource(source));
  } catch (err) {
    res.status(502).json({ id: source.id, title: source.title, error: err.message, data: null });
  }
}

export async function getAllSources(_req, res) {
  const results = await Promise.all(
    sources.map((s) =>
      readSource(s).catch((err) => ({
        id: s.id,
        title: s.title,
        widget: s.widget,
        error: err.message,
        data: null,
      })),
    ),
  );
  res.json({ sources: results });
}

export async function getActions(_req, res) {
  res.json({ actions: await listActions() });
}

export async function patchAction(req, res) {
  const updated = await updateActionStatus(req.params.id, req.body?.status || 'resolved');
  if (!updated) return res.status(404).json({ error: 'Action not found' });
  res.json(updated);
}
