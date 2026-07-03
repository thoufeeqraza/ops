import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom } from '../lib/demo.js';

// B3 · NewsAPI — headlines. Industry news table + mentions/day.
// SOP: Crisis Comms · client mentioned + negative tone. Auth: header X-Api-Key · 100/day.
const CLIENT = 'Acme';
const NEG = ['lawsuit', 'probe', 'recall', 'breach', 'scandal', 'fraud', 'layoff', 'fine',
  'downgrade', 'outage', 'delay', 'loss', 'warning', 'crash'];

const tone = (title) => {
  const t = (title || '').toLowerCase();
  return NEG.some((w) => t.includes(w)) ? 'negative' : 'neutral';
};

function demo() {
  const heads = [
    'Acme faces regulatory probe over data breach',
    'Markets rally as inflation cools',
    'Acme announces new partnership in APAC',
    'Industry braces for supply-chain delay',
    'Startup funding rebounds in Q2',
    'Acme recall widens amid safety warning',
    'Analysts upgrade sector outlook',
    'Client sentiment mixed ahead of earnings',
  ];
  const next = rng(seedFrom('newsdemo'));
  const articles = heads.map((title, i) => ({
    title,
    url: '#',
    source: ['Reuters', 'Bloomberg', 'ET', 'Mint'][i % 4],
    mentionsClient: title.includes(CLIENT),
    tone: tone(title),
  }));
  return finalize(articles, true, next);
}

function finalize(articles, demo, next) {
  const negativeClient = articles.filter((a) => a.mentionsClient && a.tone === 'negative').length;
  // synthesize a 7-day mentions trend
  const trend = Array.from({ length: 7 }, (_, i) => ({
    day: `D-${6 - i}`,
    mentions: Math.round(2 + (next ? next() : Math.random()) * 8),
  }));
  return { demo, articles, negativeClient, trend, client: CLIENT };
}

async function live(key) {
  const url = 'https://newsapi.org/v2/top-headlines?country=us&category=business&pageSize=20';
  const j = await fetchJson(url, { headers: { 'X-Api-Key': key } });
  const articles = (j.articles || []).map((a) => ({
    title: a.title,
    url: a.url,
    source: a.source?.name || 'news',
    mentionsClient: (a.title || '').includes(CLIENT),
    tone: tone(a.title),
  }));
  return finalize(articles, false, rng(seedFrom('newslive')));
}

export default {
  id: 'B3',
  title: 'NewsAPI — Crisis Comms Watch',
  question: 3,
  widget: 'news-table',
  ttl: 1800,

  async fetch() {
    if (!config.keys.newsApi) return demo();
    try {
      return await live(config.keys.newsApi);
    } catch (err) {
      console.warn(`[B3] live fetch failed (${err.message}); serving demo`);
      return demo();
    }
  },

  rules: [
    {
      id: 'B3-crisis',
      sop: 'Crisis Communications',
      sopId: 'SOP-CRISIS-01',
      assignee: 'comms@founders.office',
      slaHours: 4,
      metric: 'negative_client_mentions',
      comparator: 'gte',
      threshold: 1,
      select: (data) => [
        {
          key: 'client-negative',
          value: data.negativeClient,
          label: `${data.negativeClient} negative-tone headline(s) mention ${data.client}`,
        },
      ],
    },
  ],
};
