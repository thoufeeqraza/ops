// Deterministic demo-data helpers.
//
// Several key-based sources (B1–B10) and two scraper-only sources (Yahoo Finance,
// India MCA) can only return LIVE data once you register a key / add scraping infra.
// Until then each such source renders clearly-labelled demo data so all 25 widgets
// are visible and the trigger pipeline is demonstrable. Demo output always carries
// `demo: true`, which the frontend surfaces as a "demo" badge — it is never passed
// off as live.
//
// The generator is SEEDED (no Math.random) so a given source produces stable output
// across calls — good for caching and reproducible screenshots.

// Mulberry32 — tiny deterministic PRNG. Same seed → same sequence.
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turn a string into a stable 32-bit seed.
export function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const round = (n, d = 2) => Number(n.toFixed(d));

// A smooth-ish random walk of `n` points starting at `start`.
export function walk(next, n, start, vol) {
  const out = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v = Math.max(0, v + (next() - 0.5) * vol);
    out.push(round(v, 2));
  }
  return out;
}

// ISO dates for the last `n` days ending today (UTC), oldest first.
// `today` must be passed in (callers have a real Date; this lib stays pure-ish).
export function lastDays(n, today) {
  const out = [];
  const base = today.getTime();
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}
