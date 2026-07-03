import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom, round, walk, lastDays } from '../lib/demo.js';

// B4 · FRED — economic data. CPI / unemployment / yield line.
// SOP: Pricing Review · CPI >0.3% MoM. Auth: key in query.
const SERIES = [
  { id: 'CPIAUCSL', name: 'CPI', start: 300 },
  { id: 'UNRATE', name: 'Unemployment', start: 4 },
  { id: 'DGS10', name: '10Y Yield', start: 4.2 },
];

function buildSeries(pointsBySeries) {
  // pointsBySeries: { CPI: number[], Unemployment: number[], '10Y Yield': number[] }
  const dates = lastDays(24, new Date());
  const series = dates.map((date, i) => {
    const row = { date };
    for (const s of SERIES) row[s.name] = pointsBySeries[s.name][i];
    return row;
  });
  const cpi = pointsBySeries.CPI;
  const cpiMoM = round(((cpi[cpi.length - 1] - cpi[cpi.length - 2]) / cpi[cpi.length - 2]) * 100, 3);
  return { series, names: SERIES.map((s) => s.name), cpiMoM };
}

function demo() {
  const next = rng(seedFrom('fred'));
  const points = {};
  for (const s of SERIES) points[s.name] = walk(next, 24, s.start, s.start * 0.06);
  return { demo: true, ...buildSeries(points) };
}

async function live(key) {
  const points = {};
  for (const s of SERIES) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${key}&file_type=json&sort_order=desc&limit=24`;
    const j = await fetchJson(url);
    const vals = (j.observations || [])
      .map((o) => Number(o.value))
      .filter((v) => Number.isFinite(v))
      .reverse();
    points[s.name] = vals.length ? vals : walk(rng(seedFrom(s.id)), 24, s.start, 1);
  }
  return { demo: false, ...buildSeries(points) };
}

export default {
  id: 'B4',
  title: 'FRED — Macro Pricing Signals',
  question: 3,
  widget: 'series-line',
  ttl: 21600,

  async fetch() {
    if (!config.keys.fred) return demo();
    try {
      return await live(config.keys.fred);
    } catch (err) {
      console.warn(`[B4] live fetch failed (${err.message}); serving demo`);
      return demo();
    }
  },

  rules: [
    {
      id: 'B4-pricing',
      sop: 'Pricing Review',
      sopId: 'SOP-PRICING-01',
      assignee: 'finance@founders.office',
      slaHours: 72,
      metric: 'cpi_mom_pct',
      comparator: 'gt',
      threshold: 0.3,
      select: (data) => [
        { key: 'cpi-mom', value: data.cpiMoM, label: `CPI rose ${data.cpiMoM}% month-over-month` },
      ],
    },
  ],
};
