import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';

// C1 · SEC EDGAR — US filings. Filings timeline + 8-K alert.
// SOP: Material Event Memo · new 8-K within 24h. No key, but the User-Agent MUST
// carry a name + email (config.userAgent) or SEC blocks you. Live, no fallback needed.
const CIK = '0000320193'; // Apple Inc — swap per client
const DAY = 86400000;

export default {
  id: 'C1',
  title: 'SEC EDGAR — Material Events',
  question: 1,
  widget: 'filings',
  ttl: 3600,

  async fetch() {
    const j = await fetchJson(`https://data.sec.gov/submissions/CIK${CIK}.json`, {
      headers: { 'User-Agent': config.keys.secEdgarUA || config.userAgent },
    });
    const r = j.filings?.recent || {};
    const now = Date.now();
    const filings = (r.form || []).slice(0, 40).map((form, i) => ({
      form,
      date: r.filingDate?.[i],
      title: r.primaryDocDescription?.[i] || form,
      accession: r.accessionNumber?.[i],
    }));
    const recent8K = filings.filter(
      (f) => f.form === '8-K' && now - new Date(f.date).getTime() < DAY,
    ).length;
    return { demo: false, company: j.name, filings, recent8K };
  },

  rules: [
    {
      id: 'C1-material',
      sop: 'Material Event Memo',
      sopId: 'SOP-MATERIAL-01',
      assignee: 'legal@founders.office',
      slaHours: 24,
      metric: 'new_8k_24h',
      comparator: 'gte',
      threshold: 1,
      select: (data) => [
        { key: '8k', value: data.recent8K, label: `${data.recent8K} new 8-K filing(s) for ${data.company} in last 24h` },
      ],
    },
  ],
};
