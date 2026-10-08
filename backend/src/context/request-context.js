import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

const requestContextStorage = new AsyncLocalStorage();
const MAX_USER_AGENT_LENGTH = 512;
const MAX_PATH_LENGTH = 2048;

function normalizeIpAddress(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(/^::ffff:/, "");
  return isIP(normalized) ? normalized.slice(0, 45) : null;
}

function normalizeUserAgent(value) {
  if (!value) return null;
  const normalized = String(value).replace(/[\r\n]/g, " ").trim();
  return normalized ? normalized.slice(0, MAX_USER_AGENT_LENGTH) : null;
}

function normalizePath(req) {
  const path = String(req.originalUrl || req.path || "")
    .split("?", 1)[0]
    .replace(/[\r\n]/g, " ");
  return path.slice(0, MAX_PATH_LENGTH);
}

export function requestContextMiddleware(req, res, next) {
  const context = Object.freeze({
    requestId: randomUUID(),
    ipAddress: normalizeIpAddress(req.ip || req.socket?.remoteAddress),
    userAgent: normalizeUserAgent(req.get?.("user-agent")),
    method: String(req.method || "").toUpperCase(),
    path: normalizePath(req),
  });

  res.setHeader("X-Request-Id", context.requestId);
  requestContextStorage.run(context, next);
}

export function getRequestContext() {
  return requestContextStorage.getStore() || null;
}

// Exported for isolated service tests and non-HTTP workers.
export function runWithRequestContext(context, callback) {
  const normalized = Object.freeze({
    requestId: context?.requestId || randomUUID(),
    ipAddress: normalizeIpAddress(context?.ipAddress),
    userAgent: normalizeUserAgent(context?.userAgent),
    method: context?.method
      ? String(context.method).toUpperCase().slice(0, 16)
      : null,
    path: context?.path
      ? String(context.path).replace(/[\r\n]/g, " ").slice(0, MAX_PATH_LENGTH)
      : null,
  });
  return requestContextStorage.run(normalized, callback);
}

export { normalizeIpAddress, normalizeUserAgent };
