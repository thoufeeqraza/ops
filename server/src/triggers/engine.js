import { getStore } from '../store.js';

const ACTIONS = 'actions';

/**
 * Comparators for the (metric, comparator, threshold) trigger table.
 */
const COMPARATORS = {
  gt: (v, t) => v > t,
  gte: (v, t) => v >= t,
  lt: (v, t) => v < t,
  lte: (v, t) => v <= t,
  abs_gt: (v, t) => Math.abs(v) > t,
  abs_gte: (v, t) => Math.abs(v) >= t,
};

// UTC day bucket — the idempotency window. The same breach for the same entity on the
// same day creates exactly one card; a genuinely new day can re-trigger.
function dayBucket(iso = new Date().toISOString()) {
  return iso.slice(0, 10);
}

/**
 * Evaluate one source's rules against fresh data and queue any breaches idempotently.
 *
 * A rule:
 *   { id, sop, sopId, assignee, slaHours, metric, comparator, threshold, select(data) -> samples[] }
 * A sample: { key, value, label, context? }
 *
 * Returns the list of actions created this run (already-existing ones are skipped).
 */
export async function evaluateSource(source, data) {
  const rules = source.rules || [];
  if (!rules.length || data == null) return [];
  const store = await getStore();
  const created = [];

  for (const rule of rules) {
    const cmp = COMPARATORS[rule.comparator];
    if (!cmp) {
      console.warn(`[triggers] unknown comparator '${rule.comparator}' on rule ${rule.id}`);
      continue;
    }
    let samples = [];
    try {
      samples = rule.select(data) || [];
    } catch (err) {
      console.warn(`[triggers] rule ${rule.id} select() failed: ${err.message}`);
      continue;
    }

    for (const s of samples) {
      if (typeof s.value !== 'number' || Number.isNaN(s.value)) continue;
      if (!cmp(s.value, rule.threshold)) continue;

      const dedupeKey = `${rule.id}:${s.key}:${dayBucket()}`;
      if (await store.has(ACTIONS, dedupeKey)) continue; // idempotent: one event, one card

      const now = new Date();
      const action = {
        ruleId: rule.id,
        sourceId: source.id,
        sourceTitle: source.title,
        sop: rule.sop,
        sopId: rule.sopId,
        assignee: rule.assignee,
        slaHours: rule.slaHours,
        metric: rule.metric,
        comparator: rule.comparator,
        threshold: rule.threshold,
        value: s.value,
        label: s.label || `${rule.metric} = ${s.value}`,
        context: s.context || null,
        status: 'open',
        createdAt: now.toISOString(),
        slaDueAt: new Date(now.getTime() + rule.slaHours * 3600 * 1000).toISOString(),
      };
      await store.set(ACTIONS, dedupeKey, action);
      created.push({ ...action, _id: dedupeKey });
    }
  }
  return created;
}
