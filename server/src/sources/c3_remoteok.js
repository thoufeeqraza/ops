import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom } from '../lib/demo.js';

// C3 · RemoteOK — remote jobs. Bubble: date × salary × count.
// SOP: Market Salary Benchmark · quarterly. /api JSON; the FIRST element is a legal
// notice we must skip/respect. RemoteOK sometimes blocks datacenter IPs → on failure
// we degrade to a labelled sample so the widget still renders.
function shape(points, demo, note) {
  const withSalary = points.filter((p) => p.salary > 0);
  const median = withSalary.length
    ? withSalary.map((p) => p.salary).sort((a, b) => a - b)[Math.floor(withSalary.length / 2)]
    : 0;
  return { demo, points, median, note: note || null };
}

function demo(note) {
  const next = rng(seedFrom('remoteok'));
  const roles = ['Engineer', 'Designer', 'PM', 'Data', 'DevOps', 'Support', 'Sales', 'Marketing'];
  const points = roles.map((role, i) => ({
    role,
    salary: Math.round((60 + next() * 140)) * 1000,
    count: Math.floor(1 + next() * 20),
    daysAgo: Math.floor(next() * 30),
  }));
  return shape(points, true, note);
}

export default {
  id: 'C3',
  title: 'RemoteOK — Salary Benchmark',
  question: 3,
  widget: 'bubble',
  ttl: 43200,

  async fetch() {
    try {
      const rows = await fetchJson('https://remoteok.com/api', {
        headers: { 'User-Agent': config.userAgent },
      });
      const jobs = Array.isArray(rows) ? rows.slice(1) : []; // element 0 is the legal notice
      const byRole = {};
      const now = Date.now();
      for (const jb of jobs) {
        const role = (jb.position || 'Other').split(/[/,-]/)[0].trim();
        const salary = Math.round(((jb.salary_min || 0) + (jb.salary_max || 0)) / 2);
        const daysAgo = jb.date ? Math.floor((now - new Date(jb.date).getTime()) / 86400000) : 0;
        if (!byRole[role]) byRole[role] = { role, salary: 0, count: 0, daysAgo, n: 0 };
        byRole[role].count += 1;
        if (salary > 0) { byRole[role].salary += salary; byRole[role].n += 1; }
      }
      const points = Object.values(byRole)
        .map((r) => ({ role: r.role, salary: r.n ? Math.round(r.salary / r.n) : 0, count: r.count, daysAgo: r.daysAgo }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
      if (!points.length) return demo('RemoteOK returned no rows — showing sample');
      return shape(points, false);
    } catch (err) {
      return demo(`RemoteOK unreachable (${err.message}) — showing sample`);
    }
  },

  rules: [
    {
      id: 'C3-benchmark',
      sop: 'Market Salary Benchmark',
      sopId: 'SOP-SALARY-01',
      assignee: 'people@founders.office',
      slaHours: 336,
      metric: 'median_salary_usd',
      comparator: 'gte',
      threshold: 140000,
      select: (data) => [
        { key: 'median-salary', value: data.median, label: `Median remote salary ${data.median.toLocaleString()} USD — review comp bands` },
      ],
    },
  ],
};
