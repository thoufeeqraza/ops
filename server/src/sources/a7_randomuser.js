import { fetchJson } from '../lib/fetchWithRetry.js';

// A7 · RandomUser — mock HR. HR table + avatar grid (seeded for stability).
// No SOP trigger — this is the documented SEAM to swap for a real HRIS later.
// Swapping the provider is a single-file change: keep `id`, `title`, the normalized
// shape ({ people: [...] }) and an empty `rules`, and only this file changes.
const DEPARTMENTS = ['Engineering', 'Operations', 'Finance', 'Sales', 'People'];

export default {
  id: 'A7',
  title: 'RandomUser — HR (mock)',
  question: 2,
  widget: 'hr-table',
  ttl: 86400,

  async fetch() {
    const json = await fetchJson(
      'https://randomuser.me/api/?results=24&nat=us,in,gb&seed=opsdashboard&inc=name,email,picture,nat,location',
    );
    const people = (json.results || []).map((p, i) => ({
      name: `${p.name.first} ${p.name.last}`,
      email: p.email,
      photo: p.picture?.thumbnail,
      country: p.nat,
      city: p.location?.city,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
    }));
    return { people };
  },

  rules: [], // seam — no triggers
};
