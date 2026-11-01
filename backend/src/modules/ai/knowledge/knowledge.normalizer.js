const STOP_WORDS = new Set([
  "va", "la", "cua", "cho", "voi", "cac", "nhung", "mot", "cac", "tai",
  "trong", "theo", "ve", "co", "duoc", "gi", "nao", "nay", "do", "nay",
]);

export function normalizeKnowledgeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (letter) => letter === "Đ" ? "D" : "d")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenizeKnowledgeText(value, { removeStopWords = false } = {}) {
  const tokens = normalizeKnowledgeText(value).match(/[\p{L}\p{N}]+/gu) || [];
  return removeStopWords ? tokens.filter((token) => !STOP_WORDS.has(token)) : tokens;
}
