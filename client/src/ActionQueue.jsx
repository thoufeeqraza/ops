import { useState, useEffect } from 'react';
import { countdown, resolveAction } from './api.js';

function Sla({ action }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const msLeft = new Date(action.slaDueAt).getTime() - Date.now();
  const cls = action.status !== 'open' ? '' : msLeft < 0 ? 'bad' : msLeft < 3600_000 ? 'warn' : 'ok';
  return <span className={`sla ${cls}`}>{action.status === 'open' ? countdown(msLeft) : '✓ done'}</span>;
}

export default function ActionQueue({ actions, onChange }) {
  const open = actions.filter((a) => a.status === 'open');
  async function resolve(id) {
    await resolveAction(id);
    onChange();
  }
  return (
    <aside className="queue">
      <h2>SOP Action Queue</h2>
      <div className="sub">{open.length} open · breached threshold → SOP with an SLA clock</div>
      {actions.length === 0 && <div className="empty">No thresholds breached. All clear.</div>}
      {actions.slice(0, 30).map((a) => (
        <div key={a._id} className={`action ${a.breached ? 'breached' : ''} ${a.status !== 'open' ? 'resolved' : ''}`}>
          <div className="sop">{a.sop} <span className="chip">{a.sopId}</span></div>
          <div className="label">{a.label}</div>
          <div className="row">
            <span>→ {a.assignee}</span>
            <Sla action={a} />
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <span>{a.sourceId} · SLA {a.slaHours}h</span>
            {a.status === 'open' && <button className="btn" onClick={() => resolve(a._id)}>Mark done</button>}
          </div>
        </div>
      ))}
    </aside>
  );
}
