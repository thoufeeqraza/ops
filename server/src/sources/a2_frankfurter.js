import { fetchJson } from '../lib/fetchWithRetry.js';

// A2 · Frankfurter — FX rates. 30-day multi-currency line + rate KPI.
// SOP: Cross-border Invoicing · USD–client rate moves >2% Week-over-Week.
const TO = ['EUR', 'GBP', 'INR'];

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export default {
  id: 'A2',
  title: 'Frankfurter — FX Rates',
  question: 3,
  widget: 'multiline',
  ttl: 3600,

  async fetch() {
    const start = isoDaysAgo(30);
    const url = `https://api.frankfurter.dev/v1/${start}..?from=USD&to=${TO.join(',')}`;
    const json = await fetchJson(url);
    const dates = Object.keys(json.rates).sort();
    const series = dates.map((date) => ({ date, ...json.rates[date] }));
    const latest = series[series.length - 1] || {};

    // Week-over-week change per currency
    const weekAgo = series[Math.max(0, series.length - 6)] || latest;
    const wow = {};
    for (const c of TO) {
      if (latest[c] && weekAgo[c]) {
        wow[c] = Number((((latest[c] - weekAgo[c]) / weekAgo[c]) * 100).toFixed(2));
      }
    }
    return { currencies: TO, series, latest, wow };
  },

  rules: [
    {
      id: 'A2-invoicing',
      sop: 'Cross-border Invoicing Review',
      sopId: 'SOP-FX-01',
      assignee: 'finance@founders.office',
      slaHours: 48,
      metric: 'wow_change_pct',
      comparator: 'abs_gte',
      threshold: 2,
      select: (data) =>
        Object.entries(data.wow).map(([c, v]) => ({
          key: c,
          value: v,
          label: `USD–${c} moved ${v}% week-over-week`,
        })),
    },
  ],
};
