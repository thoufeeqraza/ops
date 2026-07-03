import { config } from '../config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One shared fetch wrapper for every outbound API call.
 *
 *   - retry on 429 and 5xx with exponential backoff (1s, 2s, 4s ... capped)
 *   - fail fast on other 4xx (404, 401 ...) — retrying won't help
 *   - honours a Retry-After header when present
 *   - always sends a descriptive User-Agent (good citizenship)
 *
 * Throws on final failure; the cache layer decides whether to serve stale.
 */
export async function fetchWithRetry(url, options = {}) {
  const {
    maxAttempts = 4,
    baseDelayMs = 1000,
    maxDelayMs = 8000,
    timeoutMs = 12000,
    headers = {},
    ...rest
  } = options;

  let attempt = 0;
  let lastErr;

  while (attempt < maxAttempts) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...rest,
        signal: controller.signal,
        headers: { 'User-Agent': config.userAgent, Accept: 'application/json', ...headers },
      });
      clearTimeout(timer);

      if (res.ok) return res;

      // Retryable: 429 (rate limited) or any 5xx (server error)
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
        lastErr.status = res.status;
        if (attempt >= maxAttempts) break;
        const retryAfter = Number(res.headers.get('retry-after')) * 1000;
        const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : backoff);
        continue;
      }

      // Non-retryable 4xx — fail fast
      const err = new Error(`HTTP ${res.status} for ${url}`);
      err.status = res.status;
      throw err;
    } catch (err) {
      clearTimeout(timer);
      // AbortError / network error are retryable; explicit non-retryable 4xx already thrown
      if (err.status && err.status < 500 && err.status !== 429) throw err;
      lastErr = err;
      if (attempt >= maxAttempts) break;
      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(backoff);
    }
  }
  throw lastErr || new Error(`fetch failed for ${url}`);
}

export async function fetchJson(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return res.json();
}
