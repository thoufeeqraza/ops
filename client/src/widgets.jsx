import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Cell, Legend,
} from 'recharts';

const fmt = (n, d = 2) =>
  n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

const SERIES_COLORS = ['#4f8cff', '#2ec27e', '#f5a623', '#c678dd', '#ff5d5d', '#38bdf8'];
const tipStyle = { background: '#131a26', border: '1px solid #243044', fontSize: 12 };

// ── A1 · CoinGecko — KPI cards + 24h sparkline ────────────────────────────────
function KpiSpark({ data }) {
  return (
    <div className="kpis">
      {data.assets.map((a) => (
        <div className="kpi" key={a.id}>
          <div className="label">{a.symbol}</div>
          <div className="value">${fmt(a.price)}</div>
          <div className={`delta ${a.change24h >= 0 ? 'up' : 'down'}`}>
            {a.change24h >= 0 ? '▲' : '▼'} {fmt(a.change24h, 1)}% (24h)
          </div>
          <div style={{ height: 32, marginTop: 6 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.sparkline.map((v, i) => ({ i, v }))}>
                <Line type="monotone" dataKey="v" dot={false} strokeWidth={1.5}
                  stroke={a.change24h >= 0 ? '#2ec27e' : '#ff5d5d'} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── A2 · Frankfurter — 30-day multi-currency line ─────────────────────────────
function MultiLine({ data }) {
  const colors = { EUR: '#4f8cff', GBP: '#2ec27e', INR: '#f5a623' };
  return (
    <>
      <div className="kpis" style={{ marginBottom: 8 }}>
        {data.currencies.map((c) => (
          <div className="kpi" key={c}>
            <div className="label">USD → {c}</div>
            <div className="value">{fmt(data.latest[c], 4)}</div>
            <div className={`delta ${(data.wow[c] ?? 0) >= 0 ? 'up' : 'down'}`}>
              {fmt(data.wow[c], 2)}% WoW
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.series}>
            <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8a98ad' }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} domain={['auto', 'auto']} width={44} />
            <Tooltip contentStyle={tipStyle} />
            {data.currencies.map((c) => (
              <Line key={c} type="monotone" dataKey={c} stroke={colors[c]} dot={false}
                strokeWidth={1.6} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── A3 · World Bank — inflation bar ───────────────────────────────────────────
function BarWidget({ data }) {
  return (
    <div style={{ height: 200 }}>
      <div className="chip" style={{ marginBottom: 8 }}>{data.indicator}</div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data.countries}>
          <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
          <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#8a98ad' }} />
          <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} width={32} />
          <Tooltip contentStyle={tipStyle} />
          <Bar dataKey="value" fill="#4f8cff" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── A4 · Hacker News — top table + domain bar ─────────────────────────────────
function TableBar({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
      <div style={{ maxHeight: 260, overflow: 'auto' }}>
        <table>
          <thead><tr><th className="num">▲</th><th>Story</th></tr></thead>
          <tbody>
            {data.stories.slice(0, 12).map((s) => (
              <tr key={s.id}>
                <td className="num">{s.score}</td>
                <td><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                  <div style={{ color: '#8a98ad', fontSize: 10 }}>{s.domain}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.domains.slice(0, 8)} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: '#8a98ad' }} />
            <YAxis type="category" dataKey="domain" width={90} tick={{ fontSize: 9, fill: '#8a98ad' }} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="count" fill="#2ec27e" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── A5 · WHO — heatmap ────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const all = data.matrix.flatMap((r) => r.cells.map((c) => c.value)).filter((v) => v != null);
  const min = Math.min(...all), max = Math.max(...all);
  const color = (v) => {
    if (v == null) return '#1a2333';
    const t = max === min ? 0.5 : (v - min) / (max - min);
    const r = Math.round(46 + t * (255 - 46));
    const g = Math.round(194 - t * (194 - 93));
    return `rgb(${r},${g},126)`;
  };
  return (
    <>
      <div className="chip" style={{ marginBottom: 8 }}>{data.indicator}</div>
      <table>
        <thead><tr><th></th>{data.years.map((y) => <th key={y} className="num">{y}</th>)}</tr></thead>
        <tbody>
          {data.matrix.map((row) => (
            <tr key={row.code}>
              <td>{row.code}</td>
              {row.cells.map((c) => (
                <td key={c.year} style={{ padding: 3 }}>
                  <div className="heatcell" style={{ background: color(c.value) }}>
                    {c.value == null ? '—' : fmt(c.value, 1)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ── A6 · Open-Meteo — gauge per office ────────────────────────────────────────
function Gauge({ data }) {
  const band = (aqi) => (aqi == null ? '#8a98ad' : aqi > 200 ? '#ff5d5d' : aqi > 100 ? '#f5a623' : '#2ec27e');
  return (
    <div className="gauge-row">
      {data.offices.map((o) => {
        const pct = Math.min(100, ((o.aqi ?? 0) / 300) * 100);
        return (
          <div className="gauge" key={o.name}>
            <div className="name">{o.name}</div>
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r="38" fill="none" stroke="#243044" strokeWidth="8" />
              <circle cx="46" cy="46" r="38" fill="none" stroke={band(o.aqi)} strokeWidth="8"
                strokeDasharray={`${(pct / 100) * 238.7} 238.7`} strokeLinecap="round"
                transform="rotate(-90 46 46)" />
              <text x="46" y="52" textAnchor="middle" fontSize="20" fontWeight="700" fill="#e6edf6">
                {o.aqi ?? '—'}
              </text>
            </svg>
            <div style={{ fontSize: 11, color: band(o.aqi) }}>
              {o.aqi == null ? 'n/a' : o.aqi > 200 ? 'Hazardous' : o.aqi > 100 ? 'Moderate' : 'Good'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── A7 · RandomUser — HR table + avatars ──────────────────────────────────────
function HrTable({ data }) {
  return (
    <>
      <div className="avatars">
        {data.people.slice(0, 16).map((p) => <img key={p.email} src={p.photo} alt={p.name} title={p.name} />)}
      </div>
      <div style={{ maxHeight: 180, overflow: 'auto' }}>
        <table>
          <thead><tr><th>Name</th><th>Dept</th><th>Loc</th></tr></thead>
          <tbody>
            {data.people.slice(0, 10).map((p) => (
              <tr key={p.email}>
                <td>{p.name}</td><td>{p.department}</td><td>{p.city} ({p.country})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── A8 · Community — word cloud + complaints ──────────────────────────────────
function WordCloud({ data }) {
  const max = Math.max(1, ...data.words.map((w) => w.value));
  return (
    <>
      <div className="wordcloud">
        {data.words.map((w) => (
          <span key={w.text} style={{ fontSize: 11 + (w.value / max) * 18, opacity: 0.55 + (w.value / max) * 0.45 }}>
            {w.text}
          </span>
        ))}
      </div>
      {data.complaints.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="chip" style={{ marginBottom: 6 }}>{data.complaintCount} complaint-flagged</div>
          <table>
            <tbody>
              {data.complaints.slice(0, 5).map((c, i) => (
                <tr key={i}><td><a href={c.url} target="_blank" rel="noreferrer">{c.title}</a></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── B1/C5 · Candlesticks (OHLC) ───────────────────────────────────────────────
function Candle({ a }) {
  const H = 78, pad = 8;
  const hi = a.high ?? a.close, lo = a.low ?? a.close, range = (hi - lo) || 1;
  const y = (v) => pad + (1 - (v - lo) / range) * (H - 2 * pad);
  const up = a.close >= a.open;
  const color = up ? '#2ec27e' : '#ff5d5d';
  const bodyTop = y(Math.max(a.open, a.close));
  const bodyH = Math.max(2, Math.abs(y(a.open) - y(a.close)));
  return (
    <div className="kpi" style={{ textAlign: 'center', minWidth: 96 }}>
      <div className="label">{a.symbol}</div>
      <svg width="40" height={H} style={{ margin: '4px auto', display: 'block' }}>
        <line x1="20" x2="20" y1={y(hi)} y2={y(lo)} stroke={color} strokeWidth="1.5" />
        <rect x="10" y={bodyTop} width="20" height={bodyH} fill={color} rx="1.5" />
      </svg>
      <div className="value" style={{ fontSize: 15 }}>{fmt(a.close)}</div>
      <div className={`delta ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {fmt(a.change, 1)}%</div>
    </div>
  );
}
function Candles({ data }) {
  return (
    <>
      <div className="kpis">{data.assets.map((a) => <Candle key={a.symbol} a={a} />)}</div>
      {data.news?.length > 0 && (
        <ul className="mini-news">{data.news.slice(0, 3).map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}
    </>
  );
}

// ── B2 · OpenWeatherMap — multi-city KPI strip ────────────────────────────────
function KpiStrip({ data }) {
  return (
    <div className="kpis">
      {data.cities.map((c) => (
        <div className={`kpi ${c.severe ? 'alert' : ''}`} key={c.name}>
          <div className="label">{c.name}</div>
          <div className="value">{fmt(c.temp, 0)}°</div>
          <div className="delta" style={{ color: c.severe ? '#ff5d5d' : '#8a98ad' }}>
            {c.condition} · {fmt(c.wind, 0)} km/h
          </div>
        </div>
      ))}
    </div>
  );
}

// ── B3 · NewsAPI — news table + mentions trend ────────────────────────────────
function NewsTable({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
      <div style={{ maxHeight: 240, overflow: 'auto' }}>
        <table>
          <tbody>
            {data.articles.slice(0, 10).map((a, i) => (
              <tr key={i}>
                <td>
                  <a href={a.url} target="_blank" rel="noreferrer">{a.title}</a>
                  <div style={{ fontSize: 10, color: '#8a98ad' }}>
                    {a.source}
                    {a.mentionsClient && <span className="chip" style={{ marginLeft: 6 }}>{data.client}</span>}
                    {a.tone === 'negative' && <span className="badge stale" style={{ borderColor: '#ff5d5d', color: '#ff5d5d' }}>negative</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ height: 220 }}>
        <div className="chip" style={{ marginBottom: 6 }}>Mentions / day</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data.trend}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8a98ad' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} width={24} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="mentions" fill="#f5a623" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── B4/C6 · Multi-series line (generic, by names[]) ───────────────────────────
function SeriesLine({ data }) {
  return (
    <>
      {data.detail?.length > 0 && (
        <div className="kpis" style={{ marginBottom: 8 }}>
          {data.detail.map((d) => (
            <div className="kpi" key={d.key}>
              <div className="label">{d.title || d.key}</div>
              <div className="value" style={{ fontSize: 17 }}>{fmt(d.latest, 0)}</div>
              <div className="delta" style={{ color: '#8a98ad' }}>avg {fmt(d.mean, 0)}</div>
            </div>
          ))}
        </div>
      )}
      {data.cpiMoM != null && (
        <div className="chip" style={{ marginBottom: 8 }}>CPI MoM: {fmt(data.cpiMoM, 3)}%</div>
      )}
      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.series}>
            <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8a98ad' }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} domain={['auto', 'auto']} width={44} />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {data.names.map((n, i) => (
              <Line key={n} type="monotone" dataKey={n} stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                dot={false} strokeWidth={1.6} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── B5 · USAJOBS — job table + openings-by-agency bar ─────────────────────────
function JobTable({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
      <div style={{ maxHeight: 240, overflow: 'auto' }}>
        <table>
          <thead><tr><th>Role</th><th>Agency</th><th className="num">Pay</th></tr></thead>
          <tbody>
            {data.jobs.slice(0, 12).map((j, i) => (
              <tr key={i}><td>{j.title}</td><td style={{ fontSize: 11, color: '#8a98ad' }}>{j.agency}</td><td className="num">{j.salary}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ height: 220 }}>
        <div className="chip" style={{ marginBottom: 6 }}>Openings by agency</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data.agencies.slice(0, 6)} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: '#8a98ad' }} />
            <YAxis type="category" dataKey="agency" width={90} tick={{ fontSize: 9, fill: '#8a98ad' }} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="count" fill="#4f8cff" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── B6 · Clockify — stacked hours + utilization ───────────────────────────────
function StackedBar({ data }) {
  const rows = data.weeks.map((w) => ({ week: w.week, ...w.byProject }));
  return (
    <>
      <div className="kpis" style={{ marginBottom: 8 }}>
        {data.util.map((u) => (
          <div className={`kpi ${u.utilization > 90 ? 'alert' : ''}`} key={u.week}>
            <div className="label">{u.week}</div>
            <div className="value" style={{ fontSize: 16 }}>{fmt(u.utilization, 0)}%</div>
          </div>
        ))}
      </div>
      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8a98ad' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} width={28} />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {data.projects.map((p, i) => (
              <Bar key={p} dataKey={p} stackId="h" fill={SERIES_COLORS[i % SERIES_COLORS.length]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── B7 · Notion — SOP kanban ──────────────────────────────────────────────────
function Kanban({ data }) {
  return (
    <div className="kanban">
      {data.columns.map((col) => (
        <div className="kanban-col" key={col.name}>
          <div className="kanban-head">{col.name} <span className="chip">{col.cards.length}</span></div>
          {col.cards.map((c, i) => (
            <div className="kanban-card" key={i}>
              {c.title}
              <div style={{ fontSize: 9, color: '#8a98ad', marginTop: 2 }}>rev {c.lastReviewed}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── B8 · Airtable — coverage gauge + client pivot ─────────────────────────────
function Coverage({ data }) {
  const pct = data.coverage;
  const col = pct >= 75 ? '#2ec27e' : pct >= 40 ? '#f5a623' : '#ff5d5d';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'center' }}>
      <div className="gauge" style={{ textAlign: 'center' }}>
        <svg width="100" height="100" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r="38" fill="none" stroke="#243044" strokeWidth="8" />
          <circle cx="46" cy="46" r="38" fill="none" stroke={col} strokeWidth="8"
            strokeDasharray={`${(pct / 100) * 238.7} 238.7`} strokeLinecap="round" transform="rotate(-90 46 46)" />
          <text x="46" y="52" textAnchor="middle" fontSize="18" fontWeight="700" fill="#e6edf6">{fmt(pct, 0)}%</text>
        </svg>
        <div style={{ fontSize: 11, color: '#8a98ad' }}>SOP coverage</div>
      </div>
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        <table>
          <thead><tr><th>Client</th><th>Stage</th><th className="num">Cov.</th></tr></thead>
          <tbody>
            {data.clients.map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td style={{ color: c.stage === 'Live' ? '#2ec27e' : '#8a98ad' }}>{c.stage}</td>
                <td className="num">{c.sopCoverage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── B9 · Trello — list flow + burn-down ───────────────────────────────────────
function Flow({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ height: 200 }}>
        <div className="chip" style={{ marginBottom: 6 }}>Cards by list</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data.lists}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8a98ad' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} width={24} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.lists.map((l, i) => (
                <Cell key={i} fill={/block/i.test(l.name) ? '#ff5d5d' : '#4f8cff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 200 }}>
        <div className="chip" style={{ marginBottom: 6 }}>Burn-down</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data.burndown}>
            <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#8a98ad' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} width={24} />
            <Tooltip contentStyle={tipStyle} />
            <Line type="monotone" dataKey="remaining" stroke="#2ec27e" dot={false} strokeWidth={1.8} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── B10 · AQICN — city AQI grid ───────────────────────────────────────────────
function AqiGrid({ data }) {
  const band = (a) => (a == null ? '#243044' : a > 200 ? '#ff5d5d' : a > 150 ? '#ff8c42' : a > 100 ? '#f5a623' : a > 50 ? '#c5c34a' : '#2ec27e');
  return (
    <div className="aqi-grid">
      {data.cities.map((c) => (
        <div className="aqi-cell" key={c.city} style={{ background: band(c.aqi) }}>
          <div className="aqi-city">{c.city}</div>
          <div className="aqi-val">{c.aqi ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

// ── C1 · SEC EDGAR — filings timeline ─────────────────────────────────────────
function Filings({ data }) {
  return (
    <>
      <div className="chip" style={{ marginBottom: 8 }}>
        {data.company} · {data.recent8K} new 8-K (24h)
      </div>
      <div style={{ maxHeight: 240, overflow: 'auto' }}>
        <table>
          <tbody>
            {data.filings.slice(0, 14).map((f, i) => (
              <tr key={i}>
                <td style={{ width: 54 }}>
                  <span className="chip" style={f.form === '8-K' ? { borderColor: '#f5a623', color: '#f5a623' } : {}}>{f.form}</span>
                </td>
                <td>{f.title}<div style={{ fontSize: 10, color: '#8a98ad' }}>{f.date}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── C2 · HN Who-is-hiring — stack demand bar ──────────────────────────────────
function HiringBar({ data }) {
  return (
    <>
      <div className="chip" style={{ marginBottom: 8 }}>{data.totalPosts} posts · {data.title}</div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byStack} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: '#8a98ad' }} />
            <YAxis type="category" dataKey="stack" width={70} tick={{ fontSize: 10, fill: '#8a98ad' }} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="count" fill="#c678dd" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── C3 · RemoteOK — salary bubble (scatter) ───────────────────────────────────
function Bubble({ data }) {
  return (
    <>
      <div className="chip" style={{ marginBottom: 8 }}>Median ${fmt(data.median, 0)} · size = openings</div>
      {data.note && <div className="err" style={{ marginBottom: 6, color: '#f5a623' }}>{data.note}</div>}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="daysAgo" name="days ago" reversed
              tick={{ fontSize: 10, fill: '#8a98ad' }} label={{ value: 'days ago', fontSize: 10, fill: '#8a98ad', position: 'insideBottom', offset: -2 }} />
            <YAxis type="number" dataKey="salary" name="salary" tick={{ fontSize: 10, fill: '#8a98ad' }} width={54}
              tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
            <ZAxis type="number" dataKey="count" range={[40, 400]} />
            <Tooltip contentStyle={tipStyle} cursor={{ strokeDasharray: '3 3' }}
              formatter={(v, n) => (n === 'salary' ? `$${fmt(v, 0)}` : v)} />
            <Scatter data={data.points} fill="#38bdf8" fillOpacity={0.7} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ── C4 · Wikipedia — client KPI tiles ─────────────────────────────────────────
function KpiTiles({ data }) {
  return (
    <div className="tiles">
      {data.tiles.map((t) => (
        <a className="tile" key={t.name} href={t.url} target="_blank" rel="noreferrer">
          {t.thumb && <img src={t.thumb} alt={t.name} />}
          <div className="tile-body">
            <div className="tile-name">{t.name} {t.changed && <span className="badge stale">change</span>}</div>
            <div className="tile-desc">{t.desc}</div>
            <div className="tile-extract">{t.extract}…</div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── C7 · India MCA — entity register ──────────────────────────────────────────
function EntityTable({ data }) {
  return (
    <>
      <div className="chip" style={{ marginBottom: 8 }}>{data.flaggedCount} flagged for KYC refresh</div>
      <div style={{ maxHeight: 240, overflow: 'auto' }}>
        <table>
          <thead><tr><th>Entity</th><th>CIN</th><th>Status</th></tr></thead>
          <tbody>
            {data.entities.map((e) => (
              <tr key={e.cin}>
                <td>{e.name}</td>
                <td style={{ fontSize: 10, color: '#8a98ad', fontFamily: 'monospace' }}>{e.cin}</td>
                <td style={{ color: e.flagged ? '#ff5d5d' : '#2ec27e' }}>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const WIDGETS = {
  'kpi-spark': KpiSpark,
  multiline: MultiLine,
  bar: BarWidget,
  'table-bar': TableBar,
  heatmap: Heatmap,
  gauge: Gauge,
  'hr-table': HrTable,
  wordcloud: WordCloud,
  candles: Candles,
  'kpi-strip': KpiStrip,
  'news-table': NewsTable,
  'series-line': SeriesLine,
  'job-table': JobTable,
  'stacked-bar': StackedBar,
  kanban: Kanban,
  coverage: Coverage,
  flow: Flow,
  'aqi-grid': AqiGrid,
  filings: Filings,
  'hiring-bar': HiringBar,
  bubble: Bubble,
  'kpi-tiles': KpiTiles,
  'entity-table': EntityTable,
};

// Which widgets are wide (span 2 columns)
export const SPAN2 = new Set([
  'multiline', 'table-bar', 'heatmap',
  'news-table', 'series-line', 'job-table', 'stacked-bar', 'kanban', 'flow', 'coverage', 'kpi-tiles',
]);
