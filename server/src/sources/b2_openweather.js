import { fetchJson } from '../lib/fetchWithRetry.js';
import { config } from '../config.js';
import { rng, seedFrom, round } from '../lib/demo.js';

// B2 · OpenWeatherMap — weather. Multi-city KPI strip.
// SOP: Business Continuity · severe weather. Auth: key in query (appid) · 60/min.
const CITIES = [
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'London', lat: 51.5072, lon: -0.1276 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
];
const SEVERE = new Set(['Thunderstorm', 'Tornado', 'Squall', 'Snow']);

function demo() {
  const conds = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Haze'];
  return {
    demo: true,
    cities: CITIES.map((c) => {
      const next = rng(seedFrom(c.name));
      const cond = conds[Math.floor(next() * conds.length)];
      return {
        name: c.name,
        temp: round(8 + next() * 30, 1),
        wind: round(next() * 90, 1), // km/h; some > severe
        condition: cond,
        severe: SEVERE.has(cond) || next() > 0.85,
      };
    }),
  };
}

async function live(key) {
  const cities = await Promise.all(
    CITIES.map(async (c) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&appid=${key}&units=metric`;
      const j = await fetchJson(url);
      const cond = j.weather?.[0]?.main || 'n/a';
      const windKmh = round((j.wind?.speed || 0) * 3.6, 1);
      return {
        name: c.name,
        temp: round(j.main?.temp ?? 0, 1),
        wind: windKmh,
        condition: cond,
        severe: SEVERE.has(cond) || windKmh > 60,
      };
    }),
  );
  return { demo: false, cities };
}

export default {
  id: 'B2',
  title: 'OpenWeatherMap — Business Continuity',
  question: 1,
  widget: 'kpi-strip',
  ttl: 900,

  async fetch() {
    if (!config.keys.openWeather) return demo();
    try {
      return await live(config.keys.openWeather);
    } catch (err) {
      console.warn(`[B2] live fetch failed (${err.message}); serving demo`);
      return demo();
    }
  },

  rules: [
    {
      id: 'B2-continuity',
      sop: 'Business Continuity Activation',
      sopId: 'SOP-CONTINUITY-01',
      assignee: 'ops@founders.office',
      slaHours: 6,
      metric: 'severe_weather',
      comparator: 'gte',
      threshold: 1,
      select: (data) =>
        data.cities
          .filter((c) => c.severe)
          .map((c) => ({
            key: c.name,
            value: 1,
            label: `Severe weather in ${c.name}: ${c.condition}, wind ${c.wind} km/h`,
          })),
    },
  ],
};
