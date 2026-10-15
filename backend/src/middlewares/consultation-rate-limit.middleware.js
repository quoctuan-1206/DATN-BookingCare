const windows = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 90;

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, value] of windows) if (value.startedAt < cutoff) windows.delete(key);
}, WINDOW_MS).unref?.();

export function consultationRateLimit(req, res, next) {
  const key = String(req.user?.id || req.ip || "anonymous");
  const now = Date.now();
  let window = windows.get(key);
  if (!window || now - window.startedAt >= WINDOW_MS) {
    window = { startedAt: now, count: 0 };
    windows.set(key, window);
  }
  window.count += 1;
  if (window.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((window.startedAt + WINDOW_MS - now) / 1000)));
    return res.status(429).json({ success: false, message: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau." });
  }
  return next();
}
