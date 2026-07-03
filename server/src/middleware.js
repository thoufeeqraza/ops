// Cross-cutting middleware — the jobs an API gateway centralises so they aren't
// copy-pasted into every route: request logging and rate limiting.

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

/**
 * Simple in-memory fixed-window rate limiter (per IP).
 * Centralised here so every route behind the gateway is protected uniformly.
 */
export function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let h = hits.get(ip);
    if (!h || now > h.resetAt) {
      h = { count: 0, resetAt: now + windowMs };
      hits.set(ip, h);
    }
    h.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - h.count));
    if (h.count > max) {
      res.setHeader('Retry-After', Math.ceil((h.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}
