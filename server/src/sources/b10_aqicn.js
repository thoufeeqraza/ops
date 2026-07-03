import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom } from '../lib/demo.js';

// B10 · AQICN — air quality index. City AQI heatmap + alert >150.
// SOP: WFH Advisory · station-measured AQI. Auth: token in query · 1000/s.
const CITIES = ['hyderabad', 'bengaluru', 'delhi', 'mumbai', 'chennai', 'kolkata', 'pune', 'london'];

function demo() {
  return {
    demo: true,
    cities: CITIES.map((city) => {
      const next = rng(seedFrom('aqi-' + city));
      return { city, aqi: Math.floor(20 + next() * 260) };
    }),
  };
}

async function live(token) {
  const cities = await Promise.all(
    CITIES.map(async (city) => {
      try {
        const j = await fetchJson(`https://api.waqi.info/feed/${city}/?token=${token}`);
        return { city, aqi: j.status === 'ok' ? Number(j.data?.aqi) : null };
      } catch {
        return { city, aqi: null };
      }
    }),
  );
  return { demo: false, cities };
}

export default {
  id: 'B10',
  title: 'AQICN — WFH Advisory (measured)',
  question: 1,
  widget: 'aqi-grid',
  ttl: 1800,

  async fetch() {
    return config.keys.aqicn ? live(config.keys.aqicn) : demo();
  },

  rules: [
    {
      id: 'B10-wfh',
      sop: 'WFH Advisory',
      sopId: 'SOP-WFH-02',
      assignee: 'people@founders.office',
      slaHours: 12,
      metric: 'station_aqi',
      comparator: 'gt',
      threshold: 150,
      select: (data) =>
        data.cities
          .filter((c) => c.aqi != null)
          .map((c) => ({ key: c.city, value: c.aqi, label: `${c.city}: station AQI ${c.aqi} (>150)` })),
    },
  ],
};
