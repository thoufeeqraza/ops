# Deploy — step by step

The app is **deploy-ready**: a multi-stage `Dockerfile` builds the React client and bakes it
into the Node server (one service, one public URL), a `/api/health` endpoint for the host's
health check, and `render.yaml` for one-click Render setup. It needs **no secrets** to run.

You run the final deploy with your own account (I can't log in for you). Pick one path.

---

## 0. One-time: install Git and push to GitHub

Git isn't installed on this machine yet. Install it once: https://git-scm.com/download/win
Then, from the `operations-dashboard/` folder:

```bash
git init
git add .
git commit -m "Operations Dashboard — MVP: 8 public sources, cache, triggers, action queue"
git branch -M main
# create an empty repo at https://github.com/new (no README), then:
git remote add origin https://github.com/<you>/operations-dashboard.git
git push -u origin main
```

`.gitignore` already excludes `.env` and `node_modules`, so no secret can leak.

---

## Path A — Render (recommended, free, Docker)

1. Go to https://dashboard.render.com → **New +** → **Blueprint**.
2. Connect your GitHub and pick the `operations-dashboard` repo. Render reads `render.yaml`.
3. Click **Apply**. It builds the Dockerfile and deploys.
4. When live you get a public URL like `https://operations-dashboard.onrender.com`.
   - Health check: `https://<your-url>/api/health` → `{"status":"ok"}`.
5. (Optional) To persist the cache + action queue across restarts, add a free **MongoDB Atlas**
   cluster and set `MONGO_URI` in the Render dashboard (Environment tab). Without it the app
   uses an in-memory store, which is fine for the MVP (it just resets on redeploy).

> Free Render services sleep after inactivity and cold-start in ~30s on the next hit.

## Path B — Railway

1. https://railway.app → **New Project** → **Deploy from GitHub repo** → pick the repo.
2. Railway detects the `Dockerfile`. Set `PORT=4000` in **Variables** if not auto-set.
3. Add a domain under **Settings → Networking → Generate Domain**.

## Path C — Run the Docker image anywhere

```bash
cd operations-dashboard
docker build -t operations-dashboard .
docker run -p 4000:4000 operations-dashboard
# open http://localhost:4000
```

## Path D — Split deploy (frontend on Vercel, backend on Render)

Only if you want them separate:
- Backend: deploy `server/` to Render as a Docker/Node service.
- Frontend: deploy `client/` to Vercel; set `VITE_API_TARGET` and the proxy, or point the
  client's fetch base at the backend URL, and set `CORS_ORIGIN` on the backend to the Vercel URL.

---

## After deploy — verify

- `GET /api/health` returns `ok`.
- The dashboard loads 8 widgets, each showing a **Last Updated** time.
- The **SOP Action Queue** shows cards with a live SLA countdown when thresholds are breached.

## Keeping data fresh (optional, Level 4)

The cache refreshes on read (stale-while-revalidate). To refresh on a schedule instead of on
page load, add a GitHub Actions cron that pings `GET /api/sources` every N minutes — a starter
workflow is in `.github/workflows/refresh.yml`.
