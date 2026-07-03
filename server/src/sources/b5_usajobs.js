import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom } from '../lib/demo.js';

// B5 · USAJOBS — job postings. Job table + openings-by-agency bar.
// SOP: Capture Management · new postings. Auth: header Authorization-Key + UA=email.
function shape(jobs, demo) {
  const byAgency = {};
  for (const j of jobs) byAgency[j.agency] = (byAgency[j.agency] || 0) + 1;
  const agencies = Object.entries(byAgency)
    .map(([agency, count]) => ({ agency, count }))
    .sort((a, b) => b.count - a.count);
  return { demo, jobs, agencies, total: jobs.length };
}

function demo() {
  const titles = ['Compliance Analyst', 'Program Manager', 'Data Scientist', 'Auditor',
    'Contract Specialist', 'Policy Advisor', 'IT Specialist', 'Grants Officer'];
  const orgs = ['Dept of Commerce', 'GSA', 'Treasury', 'Dept of Labor', 'SEC'];
  const next = rng(seedFrom('usajobs'));
  const jobs = titles.map((title, i) => ({
    title,
    agency: orgs[Math.floor(next() * orgs.length)],
    location: ['Washington, DC', 'Remote', 'New York, NY'][i % 3],
    salary: `$${80 + Math.floor(next() * 90)}k`,
  }));
  return shape(jobs, true);
}

async function live(key, ua) {
  const url = 'https://data.usajobs.gov/api/Search?Keyword=compliance&LocationName=Washington,DC&ResultsPerPage=20';
  const j = await fetchJson(url, {
    headers: { 'Authorization-Key': key, 'User-Agent': ua, Host: 'data.usajobs.gov' },
  });
  const items = j.SearchResult?.SearchResultItems || [];
  const jobs = items.map((it) => {
    const d = it.MatchedObjectDescriptor || {};
    const pay = d.PositionRemuneration?.[0] || {};
    return {
      title: d.PositionTitle,
      agency: d.OrganizationName || d.DepartmentName || 'n/a',
      location: d.PositionLocationDisplay || 'n/a',
      salary: pay.MaximumRange ? `$${Math.round(Number(pay.MaximumRange) / 1000)}k` : 'n/a',
    };
  });
  return shape(jobs, false);
}

export default {
  id: 'B5',
  title: 'USAJOBS — Capture Management',
  question: 1,
  widget: 'job-table',
  ttl: 10800,

  async fetch() {
    const { usaJobsKey, usaJobsUA } = config.keys;
    if (!usaJobsKey || !usaJobsUA) return demo();
    try {
      return await live(usaJobsKey, usaJobsUA);
    } catch (err) {
      console.warn(`[B5] live fetch failed (${err.message}); serving demo`);
      return demo();
    }
  },

  rules: [
    {
      id: 'B5-capture',
      sop: 'Capture Management',
      sopId: 'SOP-CAPTURE-01',
      assignee: 'bizdev@founders.office',
      slaHours: 48,
      metric: 'open_postings',
      comparator: 'gte',
      threshold: 5,
      select: (data) => [
        { key: 'postings', value: data.total, label: `${data.total} relevant government postings open now` },
      ],
    },
  ],
};
