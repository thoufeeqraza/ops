import a1 from './a1_coingecko.js';
import a2 from './a2_frankfurter.js';
import a3 from './a3_worldbank.js';
import a4 from './a4_hackernews.js';
import a5 from './a5_who.js';
import a6 from './a6_openmeteo.js';
import a7 from './a7_randomuser.js';
import a8 from './a8_reddit.js';

// The registry of all sources. Adding a source = drop a file + one line here.
export const sources = [a1, a2, a3, a4, a5, a6, a7, a8];

export const sourceById = Object.fromEntries(sources.map((s) => [s.id, s]));
