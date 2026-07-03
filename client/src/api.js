// All data comes from our backend (/api). The frontend never calls a source directly.
const j = (url, opts) => fetch(url, opts).then((r) => r.json());

export const getSources = () => j('/api/sources');
export const getActions = () => j('/api/actions');
export const resolveAction = (id) =>
  j(`/api/actions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  });

export function timeAgo(iso) {
  if (!iso) return 'never';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function countdown(ms) {
  const sign = ms < 0 ? '-' : '';
  let s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`;
}
