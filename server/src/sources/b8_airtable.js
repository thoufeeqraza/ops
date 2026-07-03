import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom, round } from '../lib/demo.js';

// B8 · Airtable — client CRM. Client pivot + SOP-coverage gauge.
// SOP: Escalate · onboarding incomplete >7 days. Auth: Bearer (PAT) · 5/s.
const DAY = 86400000;

function shape(clients, demo, now) {
  const covered = clients.filter((c) => c.sopCoverage >= 100).length;
  const coverage = clients.length ? round((covered / clients.length) * 100, 1) : 0;
  const stalled = clients.filter(
    (c) => c.stage !== 'Live' && now - new Date(c.startedAt).getTime() > 7 * DAY,
  );
  return { demo, clients, coverage, covered, stalledCount: stalled.length, stalled };
}

function demo(now) {
  const next = rng(seedFrom('airtable'));
  const names = ['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Hooli', 'Stark Ind'];
  const stages = ['Kickoff', 'Discovery', 'Drafting', 'Review', 'Live'];
  const clients = names.map((name) => {
    const startedDaysAgo = Math.floor(next() * 30);
    return {
      name,
      stage: stages[Math.floor(next() * stages.length)],
      sopCoverage: [0, 25, 50, 75, 100][Math.floor(next() * 5)],
      startedAt: new Date(now - startedDaysAgo * DAY).toISOString().slice(0, 10),
    };
  });
  return shape(clients, true, now);
}

async function live(key, base, table, now) {
  const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?maxRecords=50`;
  const j = await fetchJson(url, { headers: { Authorization: `Bearer ${key}` } });
  const clients = (j.records || []).map((r) => {
    const f = r.fields || {};
    return {
      name: f.Name || f.Client || 'Client',
      stage: f.Stage || 'Kickoff',
      sopCoverage: Number(f['SOP Coverage'] ?? f.Coverage ?? 0),
      startedAt: (f['Started'] || r.createdTime || '').slice(0, 10),
    };
  });
  return shape(clients, false, now);
}

export default {
  id: 'B8',
  title: 'Airtable — Client Onboarding',
  question: 2,
  widget: 'coverage',
  ttl: 1800,

  async fetch() {
    const now = Date.now();
    const { airtable, airtableBase, airtableTable } = config.keys;
    if (!airtable || !airtableBase) return demo(now);
    try {
      return await live(airtable, airtableBase, airtableTable, now);
    } catch (err) {
      console.warn(`[B8] live fetch failed (${err.message}); serving demo`);
      return demo(now);
    }
  },

  rules: [
    {
      id: 'B8-escalate',
      sop: 'Onboarding Escalation',
      sopId: 'SOP-ESCALATE-01',
      assignee: 'success@founders.office',
      slaHours: 24,
      metric: 'stalled_onboardings',
      comparator: 'gte',
      threshold: 1,
      select: (data) =>
        data.stalled.map((c) => ({
          key: c.name,
          value: 1,
          label: `${c.name} stuck in ${c.stage} > 7 days (started ${c.startedAt})`,
        })),
    },
  ],
};
