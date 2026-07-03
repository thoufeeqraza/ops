import { rng, seedFrom, round } from '../lib/demo.js';

// B6 · Clockify — time tracking. Hours/project stacked bar + utilization.
// SOP: Capacity Reallocation · >90% for 3 wks. Auth: header X-Api-Key · 30/hr.
const PROJECTS = ['SOP Drafting', 'Client Onboarding', 'Audits', 'Research'];
const CAPACITY = 40; // billable hours/week/person baseline

function shape(weeks, demo) {
  // weeks: [{ week, byProject: {p: hours}, total }]
  const util = weeks.map((w) => ({ week: w.week, utilization: round((w.total / CAPACITY) * 100, 1) }));
  const over90Streak = util.filter((u) => u.utilization > 90).length;
  return { demo, projects: PROJECTS, weeks, util, over90Streak };
}

function demo() {
  const next = rng(seedFrom('clockify'));
  const weeks = ['W-3', 'W-2', 'W-1', 'This wk'].map((week) => {
    const byProject = {};
    let total = 0;
    for (const p of PROJECTS) {
      const h = round(6 + next() * 10, 1);
      byProject[p] = h;
      total += h;
    }
    return { week, byProject, total: round(total, 1) };
  });
  return shape(weeks, true);
}

export default {
  id: 'B6',
  title: 'Clockify — Team Capacity',
  question: 2,
  widget: 'stacked-bar',
  ttl: 3600,

  // Clockify's per-project/per-week utilization needs the paged Reports API (and a
  // real workspace id + logged hours). That's out of scope for the scaffold, so B6
  // renders deterministic demo data. Wire the Reports endpoint here to go live.
  async fetch() {
    return demo();
  },

  rules: [
    {
      id: 'B6-capacity',
      sop: 'Capacity Reallocation',
      sopId: 'SOP-CAPACITY-01',
      assignee: 'delivery@founders.office',
      slaHours: 72,
      metric: 'weeks_over_90pct',
      comparator: 'gte',
      threshold: 3,
      select: (data) => [
        { key: 'utilization', value: data.over90Streak, label: `${data.over90Streak} of last 4 weeks over 90% utilization` },
      ],
    },
  ],
};
