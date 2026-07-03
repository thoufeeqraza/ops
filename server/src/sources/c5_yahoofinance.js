import { fetchJson } from '../lib/fetchWithRetry.js';
import { rng, seedFrom, round } from '../lib/demo.js';

// C5 · Yahoo Finance — ticker page. Candlestick + news card.
// SOP: Market Event Memo · >5% intraday. The brief notes the HTML is JS-rendered and
// financials need Playwright (training only, not production). Rather than ship a
// headless browser, we use Yahoo's public chart JSON when reachable, and otherwise
// render labelled demo data.
const SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];

function demo() {
  return {
    demo: true,
    assets: SYMBOLS.map((symbol) => {
      const next = rng(seedFrom('yf-' + symbol));
      const close = round(80 + next() * 300, 2);
      const change = round((next() - 0.45) * 10, 2);
      const open = round(close / (1 + change / 100), 2);
      const high = round(Math.max(open, close) * (1 + next() * 0.02), 2);
      const low = round(Math.min(open, close) * (1 - next() * 0.02), 2);
      return { symbol, open, high, low, close, change };
    }),
    news: [
      'Tech shares mixed as yields tick up',
      'Chipmakers rally on AI demand',
      'Regulators weigh new antitrust rules',
    ],
  };
}

async function live() {
  const assets = [];
  for (const symbol of SYMBOLS) {
    try {
      const j = await fetchJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,
      );
      const r = j.chart?.result?.[0];
      const q = r?.indicators?.quote?.[0] || {};
      const meta = r?.meta || {};
      const close = meta.regularMarketPrice ?? q.close?.at?.(-1) ?? 0;
      const prev = meta.chartPreviousClose ?? q.open?.[0] ?? close;
      assets.push({
        symbol,
        open: round(q.open?.[0] ?? prev, 2),
        high: round(q.high?.[0] ?? close, 2),
        low: round(q.low?.[0] ?? close, 2),
        close: round(close, 2),
        change: prev ? round(((close - prev) / prev) * 100, 2) : 0,
      });
    } catch {
      // skip unreachable symbol
    }
  }
  if (!assets.length) return demo();
  return { demo: false, assets, news: ['Live quotes via Yahoo chart API'] };
}

export default {
  id: 'C5',
  title: 'Yahoo Finance — Market Events',
  question: 1,
  widget: 'candles',
  ttl: 900,

  async fetch() {
    return live();
  },

  rules: [
    {
      id: 'C5-market',
      sop: 'Market Event Memo',
      sopId: 'SOP-MARKET-01',
      assignee: 'research@founders.office',
      slaHours: 12,
      metric: 'intraday_change_pct',
      comparator: 'abs_gte',
      threshold: 5,
      select: (data) =>
        data.assets.map((a) => ({ key: a.symbol, value: round(a.change, 2), label: `${a.symbol} moved ${a.change}% intraday (${a.close})` })),
    },
  ],
};
