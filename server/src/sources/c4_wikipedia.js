import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';

// C4 · Wikipedia — company infobox. KPI tiles per client (HQ, founded, extract).
// SOP: Re-introduction Call · leadership change. REST summary API (cleaner than
// scraping the infobox). No key; UA + ~1 req/s etiquette.
const CLIENTS = ['Reliance_Industries', 'Tata_Consultancy_Services', 'Infosys'];

export default {
  id: 'C4',
  title: 'Wikipedia — Client Profiles',
  question: 3,
  widget: 'kpi-tiles',
  ttl: 86400,

  async fetch() {
    const tiles = await Promise.all(
      CLIENTS.map(async (title) => {
        try {
          const j = await fetchJson(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
            { headers: { 'User-Agent': config.userAgent } },
          );
          return {
            name: j.title,
            desc: j.description || '',
            extract: (j.extract || '').slice(0, 160),
            thumb: j.thumbnail?.source || null,
            url: j.content_urls?.desktop?.page || '#',
            changed: /former|acqui|merg|resign|step down/i.test(j.extract || ''),
          };
        } catch {
          return { name: title.replace(/_/g, ' '), desc: 'unavailable', extract: '', thumb: null, url: '#', changed: false };
        }
      }),
    );
    return { demo: false, tiles, changes: tiles.filter((t) => t.changed).length };
  },

  rules: [
    {
      id: 'C4-reintro',
      sop: 'Re-introduction Call',
      sopId: 'SOP-REINTRO-01',
      assignee: 'accounts@founders.office',
      slaHours: 168,
      metric: 'leadership_change_signals',
      comparator: 'gte',
      threshold: 1,
      select: (data) =>
        data.tiles
          .filter((t) => t.changed)
          .map((t) => ({ key: t.name, value: 1, label: `${t.name} profile mentions a leadership/structure change` })),
    },
  ],
};
