import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const fmt = (n, d = 2) =>
  n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

// A1 · CoinGecko — KPI cards + 24h sparkline
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

// A2 · Frankfurter — 30-day multi-currency line
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
            <Tooltip contentStyle={{ background: '#131a26', border: '1px solid #243044', fontSize: 12 }} />
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

// A3 · World Bank — inflation bar
function BarWidget({ data }) {
  return (
    <div style={{ height: 200 }}>
      <div className="chip" style={{ marginBottom: 8 }}>{data.indicator}</div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data.countries}>
          <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
          <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#8a98ad' }} />
          <YAxis tick={{ fontSize: 10, fill: '#8a98ad' }} width={32} />
          <Tooltip contentStyle={{ background: '#131a26', border: '1px solid #243044', fontSize: 12 }} />
          <Bar dataKey="value" fill="#4f8cff" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// A4 · Hacker News — top table + domain bar
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
            <Tooltip contentStyle={{ background: '#131a26', border: '1px solid #243044', fontSize: 12 }} />
            <Bar dataKey="count" fill="#2ec27e" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// A5 · WHO — heatmap
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

// A6 · Open-Meteo — gauge per office
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

// A7 · RandomUser — HR table + avatars
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

// A8 · Community — word cloud + complaints
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

export const WIDGETS = {
  'kpi-spark': KpiSpark,
  multiline: MultiLine,
  bar: BarWidget,
  'table-bar': TableBar,
  heatmap: Heatmap,
  gauge: Gauge,
  'hr-table': HrTable,
  wordcloud: WordCloud,
};

// Which widgets are wide (span 2 columns)
export const SPAN2 = new Set(['multiline', 'table-bar', 'heatmap']);
