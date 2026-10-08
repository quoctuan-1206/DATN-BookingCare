import auditLogRepository from "../repositories/audit-log.repository.js";
import {
  AUDIT_ACTION_SET,
  AUDIT_RESOURCE_SET,
} from "../constants/audit-log.constants.js";
import {
  getRequestContext,
  normalizeIpAddress,
  normalizeUserAgent,
} from "../context/request-context.js";
import { sanitizeAuditValue } from "../utils/audit-log.js";

function httpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

function formatUser(user) {
  if (!user) return null;
  const fullName = [user.last_name, user.first_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: fullName || user.email,
    role: user.role?.name || null,
  };
}

function formatListItem(log) {
  return {
    id: log.id.toString(),
    userId: log.user_id ?? null,
    user: formatUser(log.user),
    action: log.action,
    resource: log.resource,
    resourceId: log.resource_id ?? null,
    ipAddress: log.ip_address ?? null,
    createdAt: log.created_at,
  };
}

function formatDetail(log) {
  return {
    ...formatListItem(log),
    oldValue: sanitizeAuditValue(log.old_value),
    newValue: sanitizeAuditValue(log.new_value),
    metadata: sanitizeAuditValue(log.metadata),
    userAgent: log.user_agent ?? null,
  };
}

function normalizeUserId(value) {
  if (value === null || value === undefined) return null;
  const userId = Number(value);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw httpError("Audit Log userId khong hop le", 400);
  }
  return userId;
}

function normalizeResourceId(value) {
  if (value === null || value === undefined || value === "") return null;
  const resourceId = String(value).trim();
  if (!resourceId || resourceId.length > 191) {
    throw httpError("Audit Log resourceId khong hop le", 400);
  }
  return resourceId;
}

function requestMetadata(context) {
  if (!context) return null;
  const metadata = {};
  if (context.requestId) metadata.requestId = context.requestId;
  if (context.method) metadata.method = context.method;
  if (context.path) metadata.path = context.path;
  return Object.keys(metadata).length ? metadata : null;
}

function mergeMetadata(metadata, context) {
  const sanitized = metadata == null ? null : sanitizeAuditValue(metadata);
  const request = requestMetadata(context);
  if (!request) return sanitized;
  if (
    sanitized &&
    typeof sanitized === "object" &&
    !Array.isArray(sanitized)
  ) {
    return { ...sanitized, request };
  }
  return sanitized == null
    ? { request }
    : { value: sanitized, request };
}

function jsonValueOrUndefined(value) {
  return value === null || value === undefined
    ? undefined
    : sanitizeAuditValue(value);
}

class AuditLogService {
  constructor({ repository = auditLogRepository, logger = console } = {}) {
    this.repository = repository;
    this.logger = logger;
  }

  // Strict API for callers that explicitly want persistence errors to surface.
  async create(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw httpError("Du lieu Audit Log khong hop le", 400);
    }

    const action = String(input.action || "").trim().toUpperCase();
    const resource = String(input.resource || "").trim().toUpperCase();
    if (!AUDIT_ACTION_SET.has(action)) {
      throw httpError("Audit Log action khong hop le", 400);
    }
    if (!AUDIT_RESOURCE_SET.has(resource)) {
      throw httpError("Audit Log resource khong hop le", 400);
    }

    const context = getRequestContext();
    const explicitIp = Object.hasOwn(input, "ipAddress");
    const explicitUserAgent = Object.hasOwn(input, "userAgent");
    const created = await this.repository.create({
      user_id: normalizeUserId(input.userId),
      action,
      resource,
      resource_id: normalizeResourceId(input.resourceId),
      old_value: jsonValueOrUndefined(input.oldValue),
      new_value: jsonValueOrUndefined(input.newValue),
      ip_address: normalizeIpAddress(
        explicitIp ? input.ipAddress : context?.ipAddress,
      ),
      user_agent: normalizeUserAgent(
        explicitUserAgent ? input.userAgent : context?.userAgent,
      ),
      metadata: mergeMetadata(input.metadata, context) ?? undefined,
    });

    return formatDetail(created);
  }

  // Business services should use record(): audit persistence can never fail
  // or roll back an already committed business operation.
  async record(input) {
    try {
      return await this.create(input);
    } catch (error) {
      this.logger?.error?.("[AuditLogService] Could not persist audit event", {
        name: error?.name || "Error",
        code: error?.code || null,
      });
      return null;
    }
  }

  async getAll(filters) {
    const result = await this.repository.findAll(filters);
    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: Math.ceil(result.total / result.limit) || 0,
      data: result.logs.map(formatListItem),
    };
  }

  async getById(id) {
    if (!/^\d+$/.test(String(id || ""))) {
      throw httpError("ID Audit Log khong hop le", 400);
    }

    const auditId = BigInt(id);
    if (auditId <= 0n) throw httpError("ID Audit Log khong hop le", 400);
    const log = await this.repository.findById(auditId);
    if (!log) throw httpError("Khong tim thay Audit Log", 404);
    return formatDetail(log);
  }
}

export { AuditLogService, formatDetail, formatListItem };
export default new AuditLogService();
