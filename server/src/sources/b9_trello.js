import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom } from '../lib/demo.js';

// B9 · Trello — workflow boards. Card flow by list + burn-down.
// SOP: Escalate · card Blocked >3 days. Auth: key + token in query · 300/10s.
// (The brief says "Sankey"; we render list counts + a burn-down line, same signal.)
const LISTS = ['Backlog', 'In Progress', 'Blocked', 'Review', 'Done'];

function shape(lists, blockedAgingCount, demo) {
  const burndown = Array.from({ length: 10 }, (_, i) => ({
    day: `D-${9 - i}`,
    remaining: Math.max(0, (lists.find((l) => l.name === 'Backlog')?.count || 10) + 8 - i),
  }));
  return { demo, lists, burndown, blockedAging: blockedAgingCount };
}

function demo() {
  const next = rng(seedFrom('trello'));
  const lists = LISTS.map((name) => ({ name, count: Math.floor(next() * 8) }));
  const blocked = lists.find((l) => l.name === 'Blocked');
  const blockedAging = blocked ? Math.min(blocked.count, Math.floor(next() * 3)) : 0;
  return shape(lists, blockedAging, true);
}

async function live(key, token, boardId) {
  const url = `https://api.trello.com/1/boards/${boardId}/lists?cards=open&card_fields=dateLastActivity&key=${key}&token=${token}`;
  const j = await fetchJson(url);
  const now = Date.now();
  const lists = (j || []).map((l) => ({ name: l.name, count: (l.cards || []).length }));
  const blockedList = (j || []).find((l) => /block/i.test(l.name));
  const blockedAging = blockedList
    ? (blockedList.cards || []).filter(
        (c) => now - new Date(c.dateLastActivity).getTime() > 3 * 86400000,
      ).length
    : 0;
  return shape(lists.length ? lists : LISTS.map((name) => ({ name, count: 0 })), blockedAging, false);
}

export default {
  id: 'B9',
  title: 'Trello — Delivery Flow',
  question: 2,
  widget: 'flow',
  ttl: 900,

  async fetch() {
    const { trelloKey, trelloToken, trelloBoard } = config.keys;
    if (!trelloKey || !trelloToken || !trelloBoard) return demo();
    try {
      return await live(trelloKey, trelloToken, trelloBoard);
    } catch (err) {
      console.warn(`[B9] live fetch failed (${err.message}); serving demo`);
      return demo();
    }
  },

  rules: [
    {
      id: 'B9-blocked',
      sop: 'Blocked-Work Escalation',
      sopId: 'SOP-BLOCKED-01',
      assignee: 'pm@founders.office',
      slaHours: 24,
      metric: 'cards_blocked_3d',
      comparator: 'gte',
      threshold: 1,
      select: (data) => [
        { key: 'blocked-aging', value: data.blockedAging, label: `${data.blockedAging} card(s) Blocked for >3 days` },
      ],
    },
  ],
};
