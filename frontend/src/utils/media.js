const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export function resolveMediaUrl(url) {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}
