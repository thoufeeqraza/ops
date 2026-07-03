import { rng, seedFrom } from '../lib/demo.js';

// C7 · India MCA — company master. Legal-entity table + status alert.
// SOP: KYC/Compliance Refresh · status change. The brief says: download the official
// bulk CSV per ROC (do NOT scrape the portal — CAPTCHA + sessions). That CSV is a
// manual/bulk artifact, so this scaffold renders a labelled sample entity register.
// Swap fetch() to parse your downloaded CSV to go live.
const STATUSES = ['Active', 'Active', 'Active', 'Under Process of Striking Off', 'Dormant', 'Strike Off'];

export default {
  id: 'C7',
  title: 'India MCA — Entity Register',
  question: 3,
  widget: 'entity-table',
  ttl: 86400,

  async fetch() {
    const next = rng(seedFrom('mca'));
    const names = ['Acme Retail Pvt Ltd', 'Globex Softech Ltd', 'Initech Services Pvt Ltd',
      'Umbrella Labs Pvt Ltd', 'Soylent Foods Ltd', 'Hooli Analytics Pvt Ltd', 'Stark Industries Pvt Ltd'];
    const entities = names.map((name, i) => {
      const status = STATUSES[Math.floor(next() * STATUSES.length)];
      return {
        name,
        cin: `U${72000 + i}TG20${10 + i}PTC${100000 + Math.floor(next() * 899999)}`,
        roc: 'RoC-Hyderabad',
        status,
        flagged: status !== 'Active' && status !== 'Dormant',
      };
    });
    return { demo: true, entities, flaggedCount: entities.filter((e) => e.flagged).length };
  },

  rules: [
    {
      id: 'C7-kyc',
      sop: 'KYC / Compliance Refresh',
      sopId: 'SOP-KYC-01',
      assignee: 'compliance@founders.office',
      slaHours: 72,
      metric: 'entity_status_change',
      comparator: 'gte',
      threshold: 1,
      select: (data) =>
        data.entities
          .filter((e) => e.flagged)
          .map((e) => ({ key: e.cin, value: 1, label: `${e.name} status is "${e.status}" — refresh KYC` })),
    },
  ],
};
