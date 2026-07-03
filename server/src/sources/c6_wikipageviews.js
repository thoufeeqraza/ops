import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { round } from '../lib/demo.js';

// C6 · Wikipedia Pageviews — attention. Client vs competitor line + anomaly.
// SOP: Reputation Audit · views >2× 30-day mean. No key; UA per Wikimedia policy.
const ARTICLES = [
  { key: 'Client', title: 'Reliance_Industries' },
  { key: 'Competitor', title: 'Adani_Group' },
];

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export default {
  id: 'C6',
  title: 'Wikipedia Pageviews — Reputation',
  question: 3,
  widget: 'series-line',
  ttl: 43200,

  async fetch() {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    const byDate = {};
    let anomaly = 0;
    const detail = [];

    for (const a of ARTICLES) {
      const url =
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user/` +
        `${encodeURIComponent(a.title)}/daily/${ymd(start)}/${ymd(end)}`;
      let items = [];
      try {
        const j = await fetchJson(url, { headers: { 'User-Agent': config.userAgent } });
        items = j.items || [];
      } catch {
        items = [];
      }
      const views = items.map((it) => it.views);
      const mean = views.length ? views.reduce((s, v) => s + v, 0) / views.length : 0;
      const latest = views.at(-1) || 0;
      if (mean > 0 && latest > 2 * mean) anomaly += 1;
      detail.push({ key: a.key, title: a.title.replace(/_/g, ' '), latest, mean: Math.round(mean) });
      for (const it of items) {
        const date = `${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}-${it.timestamp.slice(6, 8)}`;
        byDate[date] = byDate[date] || { date };
        byDate[date][a.key] = it.views;
      }
    }

    const series = Object.values(byDate).sort((x, y) => x.date.localeCompare(y.date));
    return { demo: false, series, names: ARTICLES.map((a) => a.key), detail, anomaly };
  },

  rules: [
    {
      id: 'C6-reputation',
      sop: 'Reputation Audit',
      sopId: 'SOP-REPUTATION-01',
      assignee: 'comms@founders.office',
      slaHours: 48,
      metric: 'attention_spikes',
      comparator: 'gte',
      threshold: 1,
      select: (data) =>
        data.detail
          .filter((d) => d.mean > 0 && d.latest > 2 * d.mean)
          .map((d) => ({ key: d.key, value: round(d.latest / d.mean, 1), label: `${d.title} pageviews ${round(d.latest / d.mean, 1)}× the 30-day mean` })),
    },
  ],
};
