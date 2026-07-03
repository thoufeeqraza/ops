import { getStore } from './store.js';
import { config } from './config.js';

const COLLECTION = 'cache';

/**
 * The cache stands in front of EVERY source. No widget/controller calls a source
 * directly — they call cached(key, ttl, producer).
 *
 * Strategy: stale-while-revalidate.
 *   - Fresh entry (age < ttl)            → return it immediately.
 *   - Stale entry (age >= ttl)           → return it immediately AND refresh in the
 *                                          background, so the next read is fresh.
 *   - No entry                           → fetch synchronously (first load), store, return.
 *   - Refresh fails                      → keep serving the stale value, mark stale:true.
 *
 * Every entry carries lastUpdated so each widget can show a "Last Updated" time.
 */

const inflight = new Map(); // key -> Promise (dedupe concurrent refreshes)

async function refresh(key, ttlSeconds, producer) {
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const store = await getStore();
    try {
      const data = await producer();
      const entry = {
        data,
        lastUpdated: new Date().toISOString(),
        ttlSeconds,
        stale: false,
        error: null,
      };
      await store.set(COLLECTION, key, entry);
      return entry;
    } catch (err) {
      // Refresh failed — degrade gracefully: keep the previous value, flag stale.
      const prev = await store.get(COLLECTION, key);
      if (prev) {
        const entry = { ...prev, stale: true, error: err.message };
        await store.set(COLLECTION, key, entry);
        return entry;
      }
      throw err; // nothing to serve
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

export async function cached(key, ttlSeconds, producer) {
  const ttl = ttlSeconds ?? config.defaultTtlSeconds;
  const store = await getStore();
  const entry = await store.get(COLLECTION, key);

  if (!entry) {
    // Cold cache — must fetch synchronously.
    return refresh(key, ttl, producer);
  }

  const ageMs = Date.now() - new Date(entry.lastUpdated).getTime();
  const isFresh = ageMs < ttl * 1000;

  if (!isFresh) {
    // Serve stale instantly, revalidate in background (don't await).
    refresh(key, ttl, producer).catch(() => {});
  }
  return entry;
}

export async function getCacheEntry(key) {
  const store = await getStore();
  return store.get(COLLECTION, key);
}
