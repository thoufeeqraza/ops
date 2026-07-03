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
};
