import a1 from './a1_coingecko.js';
import a2 from './a2_frankfurter.js';
import a3 from './a3_worldbank.js';
import a4 from './a4_hackernews.js';
import a5 from './a5_who.js';
import a6 from './a6_openmeteo.js';
import a7 from './a7_randomuser.js';
import a8 from './a8_reddit.js';

import b1 from './b1_alphavantage.js';
import b2 from './b2_openweather.js';
import b3 from './b3_newsapi.js';
import b4 from './b4_fred.js';
import b5 from './b5_usajobs.js';
import b6 from './b6_clockify.js';
import b7 from './b7_notion.js';
import b8 from './b8_airtable.js';
import b9 from './b9_trello.js';
import b10 from './b10_aqicn.js';

import c1 from './c1_secedgar.js';
import c2 from './c2_hnhiring.js';
import c3 from './c3_remoteok.js';
import c4 from './c4_wikipedia.js';
import c5 from './c5_yahoofinance.js';
import c6 from './c6_wikipageviews.js';
import c7 from './c7_indiamca.js';

// The registry of all 25 sources. Adding a source = drop a file + one line here.
//   A1–A8  · public, no key      (live)
//   B1–B10 · key-based           (live when the key is in .env, else labelled demo)
//   C1–C7  · scrapers/no formal API (live where keyless; demo where infra is required)
export const sources = [
  a1, a2, a3, a4, a5, a6, a7, a8,
  b1, b2, b3, b4, b5, b6, b7, b8, b9, b10,
  c1, c2, c3, c4, c5, c6, c7,
];

export const sourceById = Object.fromEntries(sources.map((s) => [s.id, s]));
