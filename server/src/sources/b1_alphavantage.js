import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom, round } from '../lib/demo.js';

// B1 · Alpha Vantage — stock/FX. Candlestick top-5 + daily-change KPI.
// SOP: Investor Update · move >5%. Auth: key in query · 25 req/DAY (binding) → long TTL.
const SYMBOLS = ['RELIANCE.BSE', 'TCS.BSE', 'INFY.BSE', 'HDFCBANK.BSE', 'ICICIBANK.BSE'];

function demo() {
  return {
    demo: true,
    assets: SYMBOLS.map((symbol) => {
      const next = rng(seedFrom(symbol));
      const base = 500 + next() * 3000;
      const change = round((next() - 0.45) * 12, 2); // biased so some breach >5%
      const close = round(base, 2);
      const open = round(close / (1 + change / 100), 2);
      const high = round(Math.max(open, close) * (1 + next() * 0.03), 2);
      const low = round(Math.min(open, close) * (1 - next() * 0.03), 2);
      return { symbol, open, high, low, close, change };
    }),
  };
}

async function live(key) {
  const assets = [];
  for (const symbol of SYMBOLS) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${key}`;
    const j = await fetchJson(url);
    const q = j['Global Quote'] || {};
    assets.push({
      symbol,
      open: Number(q['02. open']),
      high: Number(q['03. high']),
      low: Number(q['04. low']),
      close: Number(q['05. price']),
      change: Number(String(q['10. change percent'] || '0').replace('%', '')),
    });
  }
  return { demo: false, assets };
}

export default {
  id: 'B1',
  title: 'Alpha Vantage — Equity Moves',
  question: 3,
  widget: 'candles',
  ttl: 21600, // 25/day limit → cache for hours

  async fetch() {
    if (!config.keys.alphaVantage) return demo();
    try {
      return await live(config.keys.alphaVantage);
    } catch (err) {
      console.warn(`[B1] live fetch failed (${err.message}); serving demo`);
      return demo();
    }
  },

  rules: [
    {
      id: 'B1-investor',
      sop: 'Investor Update',
      sopId: 'SOP-INVESTOR-01',
      assignee: 'ir@founders.office',
      slaHours: 24,
      metric: 'daily_change_pct',
      comparator: 'abs_gte',
      threshold: 5,
      select: (data) =>
        data.assets.map((a) => ({
          key: a.symbol,
          value: round(a.change, 2),
          label: `${a.symbol} moved ${a.change}% today (close ${a.close})`,
        })),
    },
  ],
};
