import { fetchJson } from '../lib/fetchWithRetry.js';

// A8 · Community sentiment. Word cloud of titles + complaints table.
// SOP: Competitive Intelligence · complaint spike (many complaint-flagged posts).
//
// PROVIDER SWAP (documented): the brief specifies Reddit, but Reddit now returns
// HTTP 403 to datacenter / non-OAuth clients (its ToS requires authenticated API
// access). Per the "swapping a provider must be a single-file change" rule, this
// file swaps to Lobsters' open, no-key JSON API. The normalized output shape and
// the SOP trigger are unchanged, so nothing downstream changes.
const STOPWORDS = new Set(
  ('the a an and or but to of in for on with my your our this that is are be i you we it as at by ' +
    'how what why when who do does did can will just get got me about from out up so if not no ' +
    'have has had they them he she his her was were would should could into over than then using use')
    .split(' '),
);
const COMPLAINT_WORDS = ['scam', 'fraud', 'terrible', 'awful', 'worst', 'broken', 'bug', 'fail',
  'failed', 'vulnerability', 'exploit', 'outage', 'down', 'angry', 'avoid', 'warning', 'problem',
  'issue', 'attack', 'breach', 'leak'];

export default {
  id: 'A8',
  title: 'Lobsters — Community Sentiment',
  question: 3,
  widget: 'wordcloud',
  ttl: 900,

  async fetch() {
    const posts = await fetchJson('https://lobste.rs/hottest.json');

    const freq = {};
    for (const p of posts) {
      for (const raw of (p.title || '').toLowerCase().split(/[^a-z]+/)) {
        if (raw.length < 4 || STOPWORDS.has(raw)) continue;
        freq[raw] = (freq[raw] || 0) + 1;
      }
    }
    const words = Object.entries(freq)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 40);

    const complaints = posts
      .filter((p) => {
        const t = (p.title || '').toLowerCase();
        const tags = (p.tags || []).join(' ');
        return /rant|wtf/.test(tags) || COMPLAINT_WORDS.some((w) => t.includes(w));
      })
      .map((p) => ({
        title: p.title,
        score: p.score,
        comments: p.comment_count,
        url: p.comments_url || p.url,
      }));

    return { words, complaints, complaintCount: complaints.length, sampleSize: posts.length };
  },

  rules: [
    {
      id: 'A8-compete',
      sop: 'Competitive Intelligence Brief',
      sopId: 'SOP-COMPETE-01',
      assignee: 'strategy@founders.office',
      slaHours: 48,
      metric: 'complaint_count',
      comparator: 'gt',
      threshold: 3,
      select: (data) => [
        {
          key: 'community-sentiment',
          value: data.complaintCount,
          label: `${data.complaintCount} complaint-flagged posts in the community feed today (of ${data.sampleSize})`,
        },
      ],
    },
  ],
};
