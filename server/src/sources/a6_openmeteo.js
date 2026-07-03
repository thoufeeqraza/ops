import { fetchJson } from '../lib/fetchWithRetry.js';

// A6 · Open-Meteo — air quality. Gauge per office + 48h forecast.
// SOP: WFH Advisory · AQI > 200.
const OFFICES = [
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
];

export default {
  id: 'A6',
  title: 'Open-Meteo — Office Air Quality',
  question: 1,
  widget: 'gauge',
  ttl: 1800,

  async fetch() {
    const offices = await Promise.all(
      OFFICES.map(async (o) => {
        const url =
          'https://air-quality-api.open-meteo.com/v1/air-quality' +
          `?latitude=${o.lat}&longitude=${o.lon}` +
          '&current=us_aqi,pm2_5&hourly=us_aqi&forecast_days=2';
        const json = await fetchJson(url).catch(() => null);
        const forecast = json?.hourly
          ? json.hourly.time
              .map((t, i) => ({ time: t, aqi: json.hourly.us_aqi[i] }))
              .filter((_, i) => i % 6 === 0)
          : [];
        return {
          name: o.name,
          aqi: json?.current?.us_aqi ?? null,
          pm25: json?.current?.pm2_5 ?? null,
          forecast,
        };
      }),
    );
    return { offices };
  },

  rules: [
    {
      id: 'A6-wfh',
      sop: 'WFH Advisory',
      sopId: 'SOP-WFH-01',
      assignee: 'people-ops@founders.office',
      slaHours: 4,
      metric: 'aqi',
      comparator: 'gt',
      threshold: 200,
      select: (data) =>
        data.offices
          .filter((o) => o.aqi != null)
          .map((o) => ({
            key: o.name,
            value: o.aqi,
            label: `${o.name} AQI at ${o.aqi} — issue WFH advisory`,
          })),
    },
  ],
};
