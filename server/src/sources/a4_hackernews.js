import { fetchJson } from '../lib/fetchWithRetry.js';

// A4 · Hacker News — top stories. Top-20 table + stories-per-domain bar.
// SOP: Inbound Press Response · a client's domain hits the front page.
const CLIENT_DOMAINS = ['github.com', 'techcrunch.com', 'stripe.com', 'openai.com'];

function domainOf(url) {
  if (!url) return 'news.ycombinator.com';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export default {
  id: 'A4',
  title: 'Hacker News — Front Page',
  question: 1,
  widget: 'table-bar',
  ttl: 300,

  async fetch() {
    const ids = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json');
    const top = ids.slice(0, 20);
    const items = await Promise.all(
      top.map((id) =>
        fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null),
      ),
    );
    const stories = items
      .filter(Boolean)
      .map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        score: s.score || 0,
        by: s.by,
        domain: domainOf(s.url),
      }));

    const counts = {};
    for (const s of stories) counts[s.domain] = (counts[s.domain] || 0) + 1;
    const domains = Object.entries(counts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    return { stories, domains };
  },

  rules: [
    {
      id: 'A4-press',
      sop: 'Inbound Press Response',
      sopId: 'SOP-PRESS-01',
      assignee: 'comms@founders.office',
      slaHours: 6,
      metric: 'client_stories_on_front_page',
      comparator: 'gte',
      threshold: 1,
      // One card per client domain per day (not per story): "domain X is on the front page".
      select: (data) => {
        const byDomain = {};
        for (const s of data.stories) {
          if (!CLIENT_DOMAINS.includes(s.domain)) continue;
          (byDomain[s.domain] ||= []).push(s);
        }
        return Object.entries(byDomain).map(([domain, stories]) => {
          const top = stories.sort((a, b) => b.score - a.score)[0];
          return {
            key: domain,
            value: stories.length,
            label:
              `${domain} on HN front page (${stories.length} ${stories.length === 1 ? 'story' : 'stories'}). ` +
              `Top: "${top.title}" (${top.score} pts)`,
            context: { url: top.url },
          };
        });
      },
    },
  ],
};
