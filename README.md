# The Operations Dashboard

A production-grade operations dashboard for a Founder's Office. It pulls **live data** from
public sources, runs every byte through a **cache**, renders it as **widgets** (KPI cards,
charts, tables, gauges, alerts), evaluates **trigger rules**, and drops a card into the
**SOP Action Queue** with an SLA clock when a threshold is breached.

> Every byte takes the same road: **Sources → Cache → Widgets → Trigger rules → Action Queue.**
> No widget calls an API directly. The cache stands in front of all sources, and every widget
> shows a visible "Last Updated" time.

This is the **Working MVP**: the 8 public, no-key sources (A1–A8) wired end-to-end, plus the
cache, the trigger pipeline, and the Action Queue. It runs with **zero secrets**. Levels 2–4
(key-based sources, scrapers, auth/RBAC, Docker/CI) layer on top of this foundation.

## Architecture

```
              ┌─────────────────────────── server/ (Express) ───────────────────────────┐
  Browser ──▶ │  API Gateway ──▶ Middleware ──▶ Controller ──▶ Cache ──▶ Source modules  │ ──▶ external APIs
 (client/)    │  rate-limit/auth   validate/log   business      TTL+SWR    A1..A8         │
              │                                      │                                    │
              │                                      └──▶ Trigger engine ──▶ Action Queue │ (idempotent, SLA clock)
              └───────────────────────────────────────────────────────────────────────────┘
```

- **Cache** — TTL + stale-while-revalidate. Returns cached value instantly, refreshes in the
  background, and records a `lastUpdated` timestamp shown on every widget.
- **Retry/backoff** — one shared wrapper: retry on 429/5xx with exponential backoff; fail fast
  on 4xx; serve stale on final failure and flag the widget.
- **Single-file provider swap** — each source lives in one file under `server/src/sources/`.
  Swapping a provider is a single-file change.
- **Trigger rules** — `(metric, comparator, threshold) → (SOP, assignee, SLA hours)`.
  A breach creates **exactly one** action item (idempotent on a stable key).

## The 8 sources & their SOP triggers

| # | Source | Widget | SOP Trigger |
|---|--------|--------|-------------|
| A1 | CoinGecko (crypto) | KPI cards + 24h sparkline | Treasury Reserve Review · asset moves >10% intraday |
| A2 | Frankfurter (FX) | Multi-currency line + KPI | Cross-border Invoicing · USD–client >2% |
| A3 | World Bank (macro) | Bar: geographies | Pricing Review · inflation outlier |
| A4 | Hacker News (stories) | Top table + domain bar | Inbound Press Response · client on front page |
| A5 | WHO GHO (health) | Indicator heatmap | Compliance Audit · indicator worsens |
| A6 | Open-Meteo (air quality) | Gauge per office | WFH Advisory · AQI > 200 |
| A7 | RandomUser (mock HR) | HR table + avatars | — (seam to swap for a real HRIS later) |
| A8 | Reddit (sentiment) | Word cloud + complaints | Competitive Intelligence · complaint spike |

## Run it locally

Prereqs: Node 18+ (tested on v24). MongoDB is **optional** — without `MONGO_URI` the app uses an
in-memory store so it runs with zero setup.

```bash
# 1. backend
cd server
cp .env.example .env        # optional: edit values
npm install
npm run dev                 # http://localhost:4000  (API + /api/health)

# 2. frontend (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :4000)
```

Open http://localhost:5173.

## Deploy

See [DEPLOY.md](DEPLOY.md). The repo ships with a `Dockerfile`, `render.yaml`, a `/api/health`
health check, and `.env.example`. Push to a public URL with Render / Railway / Fly free tiers.

## Repo layout

```
server/   Express API: gateway, middleware, cache, sources, triggers, action queue
client/   React (Vite) dashboard: widgets + Action Queue
DEPLOY.md  step-by-step deploy
```
