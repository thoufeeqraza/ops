import { fetchJson } from '../lib/fetchWithRetry.js';

// A3 · World Bank — macro. Bar: inflation across HQ vs operating geographies.
// SOP: Pricing Review · inflation runs hot in a geography.
const COUNTRIES = ['IND', 'USA', 'GBR', 'DEU', 'BRA'];
const INDICATOR = 'FP.CPI.TOTL.ZG'; // inflation, consumer prices (annual %)

export default {
  id: 'A3',
  title: 'World Bank — Inflation',
  question: 3,
  widget: 'bar',
  ttl: 86400,

  async fetch() {
    const url =
      `https://api.worldbank.org/v2/country/${COUNTRIES.join(';')}` +
      `/indicator/${INDICATOR}?format=json&per_page=400&mrnev=1`;
    const json = await fetchJson(url);
    const rows = Array.isArray(json) ? json[1] || [] : [];
    const countries = rows
      .filter((r) => r.value != null)
      .map((r) => ({
        country: r.country?.value,
        code: r.countryiso3code,
        value: Number(Number(r.value).toFixed(2)),
        year: r.date,
      }));
    return { indicator: 'Inflation, consumer prices (annual %)', countries };
  },

  rules: [
    {
      id: 'A3-pricing',
      sop: 'Pricing Review',
      sopId: 'SOP-PRICING-01',
      assignee: 'pricing@founders.office',
      slaHours: 72,
      metric: 'inflation_pct',
      comparator: 'gt',
      threshold: 6,
      select: (data) =>
        data.countries.map((c) => ({
          key: c.code,
          value: c.value,
          label: `${c.country} inflation at ${c.value}% (${c.year})`,
        })),
    },
  ],
};
