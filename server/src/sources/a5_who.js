import { fetchJson } from '../lib/fetchWithRetry.js';

// A5 · WHO GHO — health. Heatmap of an indicator by country over recent years.
// SOP: Compliance Audit · indicator worsens year-over-year.
// NCDMORT3070 = probability of dying from a noncommunicable disease (30-70), %.
const COUNTRIES = ['IND', 'USA', 'GBR', 'CHN', 'BRA'];

export default {
  id: 'A5',
  title: 'WHO — NCD Mortality',
  question: 3,
  widget: 'heatmap',
  ttl: 86400,

  async fetch() {
    const filter = encodeURIComponent("Dim1 eq 'SEX_BTSX'"); // both sexes
    const url = `https://ghoapi.azureedge.net/api/NCDMORT3070?$filter=${filter}`;
    const json = await fetchJson(url);
    const rows = (json.value || []).filter((r) => COUNTRIES.includes(r.SpatialDim));

    const byCountry = {};
    const yearsSet = new Set();
    for (const r of rows) {
      const year = r.TimeDim;
      yearsSet.add(year);
      byCountry[r.SpatialDim] = byCountry[r.SpatialDim] || {};
      byCountry[r.SpatialDim][year] = Number(r.NumericValue?.toFixed?.(1) ?? r.NumericValue);
    }
    const years = [...yearsSet].sort().slice(-6);
    const matrix = COUNTRIES.map((code) => ({
      code,
      cells: years.map((y) => ({ year: y, value: byCountry[code]?.[y] ?? null })),
    }));
    return { indicator: 'NCD mortality (prob. 30–70), %', years, matrix };
  },

  rules: [
    {
      id: 'A5-compliance',
      sop: 'Compliance Audit',
      sopId: 'SOP-COMPLIANCE-01',
      assignee: 'compliance@founders.office',
      slaHours: 168,
      metric: 'indicator_yoy_delta',
      comparator: 'gt',
      threshold: 0,
      select: (data) =>
        data.matrix
          .map((row) => {
            const vals = row.cells.filter((c) => c.value != null);
            if (vals.length < 2) return null;
            const latest = vals[vals.length - 1];
            const prev = vals[vals.length - 2];
            return {
              key: row.code,
              value: Number((latest.value - prev.value).toFixed(2)),
              label: `${row.code} NCD mortality rose ${(latest.value - prev.value).toFixed(1)} pts (${prev.year}→${latest.year})`,
            };
          })
          .filter(Boolean),
    },
  ],
};
