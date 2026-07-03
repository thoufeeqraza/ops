# The Operations Dashboard

A production-grade operations dashboard for a Founder's Office. It pulls **live data** from
public sources, runs every byte through a **cache**, renders it as **widgets** (KPI cards,
charts, tables, gauges, alerts), evaluates **trigger rules**, and drops a card into the
**SOP Action Queue** with an SLA clock when a threshold is breached.

> Every byte takes the same road: **Sources → Cache → Widgets → Trigger rules → Action Queue.**
> No widget calls an API directly. The cache stands in front of all sources, and every widget
> shows a visible "Last Updated" time.

All **25 sources** are wired end-to-end (A1–A8 public · B1–B10 key-based · C1–C7 scrapers),
plus the cache, the trigger pipeline, and the Action Queue. It runs with **zero secrets**: the
public sources and the keyless scrapers are live, while each key-based source (B1–B10) renders
clearly-labelled **demo** data until you add its key to `server/.env` — then it goes live with
no code change (single-file provider seam). Remaining Levels 3–4 work (auth/RBAC, Docker/CI)
layers on top of this foundation.

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
- **Demo fallback** — key-based sources render deterministic, `demo`-flagged sample data when
  their key is absent, so all 25 widgets are visible from the first `npm run dev`.

## The 25 sources & their SOP triggers

**A · Public, no key (live)**

| # | Source | Widget | SOP Trigger |
|---|--------|--------|-------------|
| A1 | CoinGecko (crypto) | KPI cards + 24h sparkline | Treasury Reserve Review · asset moves >10% intraday |
| A2 | Frankfurter (FX) | Multi-currency line + KPI | Cross-border Invoicing · USD–client >2% |
| A3 | World Bank (macro) | Bar: geographies | Pricing Review · inflation outlier |
| A4 | Hacker News (stories) | Top table + domain bar | Inbound Press Response · client on front page |
| A5 | WHO GHO (health) | Indicator heatmap | Compliance Audit · indicator worsens |
| A6 | Open-Meteo (air quality) | Gauge per office | WFH Advisory · AQI > 200 |
| A7 | RandomUser (mock HR) | HR table + avatars | — (seam to swap for a real HRIS later) |
| A8 | Reddit/Lobsters (sentiment) | Word cloud + complaints | Competitive Intelligence · complaint spike |

**B · Key-based (live when key in `.env`, else demo)**

| # | Source | Widget | SOP Trigger | Env key |
|---|--------|--------|-------------|---------|
| B1 | Alpha Vantage (equity) | Candlesticks + change | Investor Update · move >5% | `ALPHAVANTAGE_KEY` |
| B2 | OpenWeatherMap | Multi-city KPI strip | Business Continuity · severe weather | `OPENWEATHER_KEY` |
| B3 | NewsAPI | News table + mentions bar | Crisis Comms · negative client mention | `NEWSAPI_KEY` |
| B4 | FRED (macro) | CPI/unemployment/yield line | Pricing Review · CPI >0.3% MoM | `FRED_KEY` |
| B5 | USAJOBS | Job table + agency bar | Capture Management · new postings | `USAJOBS_KEY` + `USAJOBS_UA` |
| B6 | Clockify | Stacked hours + utilization | Capacity Reallocation · >90% for 3 wks | `CLOCKIFY_KEY` + `CLOCKIFY_WORKSPACE` |
| B7 | Notion | SOP kanban | SOP Refresh · unreviewed 6+ months | `NOTION_KEY` + `NOTION_DB` |
| B8 | Airtable | Coverage gauge + client pivot | Escalate · onboarding stalled >7 days | `AIRTABLE_KEY` + `AIRTABLE_BASE` |
| B9 | Trello | List flow + burn-down | Escalate · card Blocked >3 days | `TRELLO_KEY` + `TRELLO_TOKEN` + `TRELLO_BOARD` |
| B10 | AQICN | City AQI grid | WFH Advisory · station AQI >150 | `AQICN_TOKEN` |

**C · Scrapers / no formal API**

| # | Source | Widget | SOP Trigger | Live? |
|---|--------|--------|-------------|-------|
| C1 | SEC EDGAR | Filings timeline | Material Event Memo · new 8-K in 24h | live (UA with email) |
| C2 | HN "Who is hiring" | Stack-demand bar | Org Design Refresh · client hiring | live (HN API) |
| C3 | RemoteOK | Salary bubble (scatter) | Market Salary Benchmark | live (sample on block) |
| C4 | Wikipedia infobox | Client KPI tiles | Re-introduction Call · leadership change | live (REST summary) |
| C5 | Yahoo Finance | Candlesticks + news | Market Event Memo · >5% intraday | live (chart JSON) |
| C6 | Wikipedia Pageviews | Client vs competitor line | Reputation Audit · views >2× mean | live |
| C7 | India MCA | Entity register table | KYC/Compliance Refresh · status change | demo (bulk CSV) |

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
