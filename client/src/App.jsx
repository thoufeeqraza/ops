import { useState, useEffect, useCallback } from 'react';
import { getSources, getActions, timeAgo } from './api.js';
import { WIDGETS, SPAN2 } from './widgets.jsx';
import ActionQueue from './ActionQueue.jsx';

function Widget({ s }) {
  const Body = WIDGETS[s.widget];
  return (
    <section className={`widget ${SPAN2.has(s.widget) ? 'span2' : ''}`}>
      <div className="widget-head">
        <div className="widget-title">
          {s.id} · {s.title}
          <span className="badge q">Q{s.question}</span>
          {s.data?.demo && <span className="badge demo" title="Add this provider's key/config to server/.env to go live">demo</span>}
          {s.stale && <span className="badge stale">stale</span>}
        </div>
        <div className="widget-meta">Last updated: {timeAgo(s.lastUpdated)}</div>
      </div>
      {s.error && !s.data ? (
        <div className="err">Source unavailable: {s.error}</div>
      ) : Body && s.data ? (
        <Body data={s.data} />
      ) : (
        <div className="loading">No data.</div>
      )}
    </section>
  );
}

export default function App() {
  const [sources, setSources] = useState(null);
  const [actions, setActions] = useState([]);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const loadActions = useCallback(() => getActions().then((r) => setActions(r.actions || [])), []);

  const load = useCallback(async () => {
    const [s] = await Promise.all([getSources(), loadActions()]);
    setSources(s.sources || []);
    setRefreshedAt(new Date().toISOString());
  }, [loadActions]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // poll the cache every minute
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>THE OPERATIONS DASHBOARD</h1>
          <div className="sub">Sources → Cache → Widgets → Trigger rules → Action Queue · 25 sources (8 public · 10 key-based · 7 scrapers)</div>
        </div>
        <div className="meta">
          {refreshedAt ? `Synced ${timeAgo(refreshedAt)}` : 'Loading…'}<br />
          {actions.filter((a) => a.status === 'open').length} open actions
        </div>
      </header>

      <div className="layout">
        <main className="grid">
          {!sources && <div className="loading">Loading widgets…</div>}
          {sources && sources.map((s) => <Widget key={s.id} s={s} />)}
        </main>
        <ActionQueue actions={actions} onChange={loadActions} />
      </div>
    </>
  );
}
