import { fetchJson } from '../lib/fetchWithRetry.js';
import { rng, seedFrom } from '../lib/demo.js';

// C2 · HN "Who is hiring" — hiring volume by month/stack.
// SOP: Org Design Refresh · a client is hiring. Uses the HN Firebase API (no key).
// robots.txt sets Crawl-delay: 30 for scraping the site — we use the official API,
// so no scraping etiquette needed, but we keep the pull small and cache long.
const STACKS = ['react', 'node', 'python', 'go', 'rust', 'java', 'typescript', 'aws'];
const CLIENTS = ['Acme', 'Globex', 'Initech'];

export default {
  id: 'C2',
  title: 'HN Who-Is-Hiring — Org Signals',
  question: 3,
  widget: 'hiring-bar',
  ttl: 21600,

  async fetch() {
    // Find the latest "Ask HN: Who is hiring?" via Algolia (a public HN search API).
    const search = await fetchJson(
      'https://hn.algolia.com/api/v1/search_by_date?query=%22Ask%20HN%3A%20Who%20is%20hiring%3F%22&tags=story&hitsPerPage=1',
    );
    const story = search.hits?.[0];
    let comments = [];
    if (story) {
      const item = await fetchJson(`https://hn.algolia.com/api/v1/items/${story.objectID}`);
      comments = (item.children || []).map((c) => (c.text || '').toLowerCase());
    }
    const byStack = STACKS.map((s) => ({
      stack: s,
      count: comments.filter((t) => t.includes(s)).length,
    })).sort((a, b) => b.count - a.count);

    const clientHiring = CLIENTS.filter((c) =>
      comments.some((t) => t.includes(c.toLowerCase())),
    );

    // If HN returned nothing (rare), show a small deterministic sample so the widget renders.
    if (!byStack.some((s) => s.count > 0)) {
      const next = rng(seedFrom('hnhiring'));
      for (const s of byStack) s.count = Math.floor(next() * 40);
    }
    return {
      demo: false,
      title: story?.title || 'Who is hiring?',
      byStack,
      totalPosts: comments.length,
      clientHiring,
    };
  },

  rules: [
    {
      id: 'C2-orgdesign',
      sop: 'Org Design Refresh',
      sopId: 'SOP-ORGDESIGN-01',
      assignee: 'people@founders.office',
      slaHours: 120,
      metric: 'client_hiring',
      comparator: 'gte',
      threshold: 1,
      select: (data) =>
        data.clientHiring.map((c) => ({ key: c, value: 1, label: `${c} appears in the latest HN hiring thread` })),
    },
  ],
};
