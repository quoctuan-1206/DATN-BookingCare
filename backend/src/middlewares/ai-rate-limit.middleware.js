const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_KEYS = 10_000;
const windows = new Map();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}, WINDOW_MS);
cleanupTimer.unref?.();

export function aiRateLimit(req, res, next) {
  const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || "unknown"}`;
  const now = Date.now();
  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    if (!entry && windows.size >= MAX_KEYS) {
      for (const [storedKey, storedEntry] of windows) {
        if (storedEntry.resetAt <= now) windows.delete(storedKey);
      }
      if (windows.size >= MAX_KEYS) {
        res.setHeader("Retry-After", "60");
        return res.status(429).json({ success: false, message: "Too many AI requests. Please try again later." });
      }
    }
    entry = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, entry);
  }

  if (entry.count >= MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
    return res.status(429).json({ success: false, message: "Too many AI requests. Please try again later." });
  }

  entry.count += 1;
  if (windows.size > MAX_KEYS) {
    for (const [storedKey, storedEntry] of windows) {
      if (storedEntry.resetAt <= now) windows.delete(storedKey);
    }
  }
  return next();
}
