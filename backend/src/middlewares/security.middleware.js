// Dữ liệu y tế và tệp kết quả không được lưu trong cache dùng chung hoặc cache trình duyệt.
export function preventSensitiveCaching(_req, res, next) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}

const UPLOAD_WINDOW_MS = 15 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 20;
const uploadWindows = new Map();

export function limitClinicalUploads(req, res, next) {
  const now = Date.now();
  const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
  const current = uploadWindows.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + UPLOAD_WINDOW_MS }
    : current;

  if (entry.count >= MAX_UPLOADS_PER_WINDOW) {
    res.setHeader(
      "Retry-After",
      String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))),
    );
    return res.status(429).json({
      success: false,
      message: "Bạn đã tải lên quá nhiều tệp. Vui lòng thử lại sau.",
    });
  }

  entry.count += 1;
  uploadWindows.set(key, entry);

  // Dọn các cửa sổ hết hạn để Map không tăng vô hạn trên tiến trình dài hạn.
  if (uploadWindows.size > 1000) {
    for (const [storedKey, storedEntry] of uploadWindows) {
      if (storedEntry.resetAt <= now) uploadWindows.delete(storedKey);
    }
  }

  next();
}
