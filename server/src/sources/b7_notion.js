import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom } from '../lib/demo.js';

// B7 · Notion — SOP registry DB. Kanban: Draft › Review › Published › Retired.
// SOP: SOP Refresh · unreviewed 6+ months. Auth: Bearer + Notion-Version header.
const COLUMNS = ['Draft', 'Review', 'Published', 'Retired'];
const DAY = 86400000;

function shape(cards, demo, now) {
  const columns = COLUMNS.map((name) => ({
    name,
    cards: cards.filter((c) => c.status === name),
  }));
  const staleCount = cards.filter(
    (c) => c.status === 'Published' && now - new Date(c.lastReviewed).getTime() > 180 * DAY,
  ).length;
  return { demo, columns, staleCount, total: cards.length };
}

function demo(now) {
  const next = rng(seedFrom('notion'));
  const names = ['Vendor Onboarding', 'Incident Response', 'Payroll Run', 'Data Retention',
    'Refund Handling', 'Access Review', 'Release Checklist', 'Client Kickoff', 'Expense Policy'];
  const cards = names.map((title, i) => {
    const ageDays = Math.floor(next() * 400);
    return {
      title,
      status: COLUMNS[Math.min(3, Math.floor(next() * 4))] || 'Draft',
      lastReviewed: new Date(now - ageDays * DAY).toISOString().slice(0, 10),
    };
  });
  return shape(cards, true, now);
}

async function live(key, dbId, now) {
  const url = `https://api.notion.com/v1/databases/${dbId}/query`;
  const j = await fetchJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 50 }),
  });
  const cards = (j.results || []).map((p) => {
    const props = p.properties || {};
    const titleProp = Object.values(props).find((v) => v.type === 'title');
    const statusProp = Object.values(props).find((v) => v.type === 'status' || v.type === 'select');
    return {
      title: titleProp?.title?.[0]?.plain_text || 'Untitled',
      status: statusProp?.status?.name || statusProp?.select?.name || 'Draft',
      lastReviewed: (p.last_edited_time || p.created_time || '').slice(0, 10),
    };
  });
  return shape(cards, false, now);
}

export default {
  id: 'B7',
  title: 'Notion — SOP Registry',
  question: 3,
  widget: 'kanban',
  ttl: 1800,

  async fetch() {
    const now = Date.now();
    const { notion, notionDb } = config.keys;
    if (!notion || !notionDb) return demo(now);
    try {
      return await live(notion, notionDb, now);
    } catch (err) {
      console.warn(`[B7] live fetch failed (${err.message}); serving demo`);
      return demo(now);
    }
  },

  rules: [
    {
      id: 'B7-refresh',
      sop: 'SOP Refresh',
      sopId: 'SOP-REFRESH-01',
      assignee: 'quality@founders.office',
      slaHours: 168,
      metric: 'stale_published_sops',
      comparator: 'gte',
      threshold: 1,
      select: (data) => [
        { key: 'stale-sops', value: data.staleCount, label: `${data.staleCount} published SOP(s) unreviewed for 6+ months` },
      ],
    },
  ],
};
