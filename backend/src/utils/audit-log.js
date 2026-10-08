export const AUDIT_REDACTED_VALUE = "[REDACTED]";

const MAX_DEPTH = 12;
const MAX_ARRAY_ITEMS = 1000;
const MAX_OBJECT_KEYS = 1000;
const MAX_STRING_LENGTH = 20_000;

const SENSITIVE_KEY_PARTS = [
  "password",
  "token",
  "otp",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "securehash",
  "credential",
  "privatekey",
];

function normalizedKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isSensitiveAuditKey(key) {
  const normalized = normalizedKey(key);
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function sanitizeString(value) {
  if (/^Bearer\s+\S+/i.test(value.trim())) return AUDIT_REDACTED_VALUE;
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.trim())) {
    return AUDIT_REDACTED_VALUE;
  }
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}[TRUNCATED]`;
}

function sanitizeValue(value, seen, depth) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value) || ArrayBuffer.isView(value)) {
    return "[BINARY OMITTED]";
  }
  if (depth >= MAX_DEPTH) return "[MAX DEPTH]";
  if (typeof value.toJSON === "function") {
    try {
      const jsonValue = value.toJSON();
      if (jsonValue !== value) return sanitizeValue(jsonValue, seen, depth + 1);
    } catch {
      return "[UNSERIALIZABLE]";
    }
  }
  if (seen.has(value)) return "[CIRCULAR]";

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const items = value
        .slice(0, MAX_ARRAY_ITEMS)
        .map((item) => sanitizeValue(item, seen, depth + 1) ?? null);
      if (value.length > MAX_ARRAY_ITEMS) items.push("[TRUNCATED]");
      return items;
    }

    if (value instanceof Error) {
      return {
        name: sanitizeString(value.name || "Error"),
        message: sanitizeString(value.message || ""),
      };
    }

    const result = {};
    const entries = Object.entries(value);
    for (const [key, child] of entries.slice(0, MAX_OBJECT_KEYS)) {
      if (isSensitiveAuditKey(key)) {
        result[key] = AUDIT_REDACTED_VALUE;
        continue;
      }
      const sanitized = sanitizeValue(child, seen, depth + 1);
      if (sanitized !== undefined) result[key] = sanitized;
    }
    if (entries.length > MAX_OBJECT_KEYS) result.__truncated__ = true;
    return result;
  } finally {
    seen.delete(value);
  }
}

// Returns a detached JSON-safe copy and never mutates the source value.
export function sanitizeAuditValue(value) {
  return sanitizeValue(value, new WeakSet(), 0);
}

export function sanitizeAuditRecord(record) {
  if (!record) return record;
  return {
    ...record,
    old_value: sanitizeAuditValue(record.old_value),
    new_value: sanitizeAuditValue(record.new_value),
    metadata: sanitizeAuditValue(record.metadata),
  };
}
