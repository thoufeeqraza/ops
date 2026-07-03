import { fetchJson } from '../lib/fetchWithRetry.js';

// A1 · CoinGecko — crypto. KPI cards + 24h sparkline.
// SOP: Treasury Reserve Review · asset moves >10% intraday.
const IDS = ['bitcoin', 'ethereum', 'solana'];

export default {
  id: 'A1',
  title: 'CoinGecko — Crypto Treasury',
  question: 1,
  widget: 'kpi-spark',
  ttl: 120,

  async fetch() {
    const url =
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd' +
      `&ids=${IDS.join(',')}&sparkline=true&price_change_percentage=24h`;
    const rows = await fetchJson(url);
    return {
      assets: rows.map((r) => ({
        id: r.id,
        symbol: (r.symbol || '').toUpperCase(),
        name: r.name,
        price: r.current_price,
        change24h: r.price_change_percentage_24h ?? 0,
        sparkline: (r.sparkline_in_7d?.price || []).slice(-48),
      })),
    };
  },

  rules: [
    {
      id: 'A1-treasury',
      sop: 'Treasury Reserve Review',
      sopId: 'SOP-TREASURY-01',
      assignee: 'cfo@founders.office',
      slaHours: 24,
      metric: 'intraday_change_pct',
      comparator: 'abs_gte',
      threshold: 10,
      select: (data) =>
        data.assets.map((a) => ({
          key: a.id,
          value: Number(a.change24h.toFixed(2)),
          label: `${a.symbol} moved ${a.change24h.toFixed(1)}% in 24h (now $${a.price})`,
        })),
    },
  ],
};
