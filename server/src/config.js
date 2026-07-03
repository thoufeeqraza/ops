import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load server/.env regardless of the current working directory, so `npm start`
// from the repo root and `npm run dev` from server/ both pick it up.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || '',
  mongoDb: process.env.MONGO_DB || 'ops_dashboard',
  defaultTtlSeconds: Number(process.env.DEFAULT_TTL_SECONDS) || 300,
  userAgent: process.env.USER_AGENT || 'OperationsDashboard/1.0',

  // Provider keys for the key-based sources (B1–B10). Blank = source renders
  // labelled demo data instead of failing. Never commit real values (server/.env
  // is gitignored); put them there, not in .env.example.
  // Env var names follow the canonical .env layout. A couple accept an older
  // alias too (|| fallback) so both spellings work.
  keys: {
    alphaVantage: process.env.ALPHAVANTAGE_KEY || '',
    openWeather: process.env.OPENWEATHER_KEY || '',
    newsApi: process.env.NEWSAPI_KEY || '',
    fred: process.env.FRED_KEY || '',
    usaJobsKey: process.env.USAJOBS_KEY || '',
    usaJobsUA: process.env.USAJOBS_EMAIL || process.env.USAJOBS_UA || '', // USAJOBS wants your email as User-Agent
    clockify: process.env.CLOCKIFY_KEY || '',
    clockifyWorkspace: process.env.CLOCKIFY_WORKSPACE || '',
    notion: process.env.NOTION_TOKEN || process.env.NOTION_KEY || '',
    notionDb: process.env.NOTION_DB_ID || process.env.NOTION_DB || '',
    airtable: process.env.AIRTABLE_PAT || process.env.AIRTABLE_KEY || '',
    airtableBase: process.env.AIRTABLE_BASE || '',
    airtableTable: process.env.AIRTABLE_TABLE || 'Clients',
    trelloKey: process.env.TRELLO_KEY || '',
    trelloToken: process.env.TRELLO_TOKEN || '',
    trelloBoard: process.env.TRELLO_BOARD || '',
    aqicn: process.env.AQICN_TOKEN || '',
    secEdgarUA: process.env.SEC_EDGAR_UA || '', // C1 override; else falls back to userAgent
  },
};
