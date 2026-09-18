// YYYY-MM-DD → Date (UTC midnight)
export function parseDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// HH:mm hoặc HH:mm:ss → Date (UTC epoch day)
export function parseTimeOnly(timeStr) {
  const parts = String(timeStr).split(":");
  const hh = parts[0].padStart(2, "0");
  const mm = (parts[1] || "00").padStart(2, "0");
  const ss = (parts[2] || "00").padStart(2, "0");
  return new Date(`1970-01-01T${hh}:${mm}:${ss}.000Z`);
}

// Date → chuỗi YYYY-MM-DD
export function formatDateOnly(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

// Date → chuỗi HH:mm
export function formatTimeOnly(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(11, 16);
}

// YYYY-MM-DD → chuỗi hiển thị DD/MM/YYYY
export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

// DateTime → chuỗi hiển thị DD/MM/YYYY HH:mm (theo giờ máy chủ/local)
export function formatDateTimeDisplay(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

// DateTime → HH:mm local
export function formatClockTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}
