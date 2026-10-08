import test from "node:test";
import assert from "node:assert/strict";
import { AuditLogService } from "../src/services/audit-log.service.js";
import { runWithRequestContext } from "../src/context/request-context.js";
import { queryAuditLogSchema } from "../src/validators/audit-log.validator.js";
import { authorize } from "../src/middlewares/role.middleware.js";
import auditLogRoutes from "../src/routes/audit-log.routes.js";

function createRepository() {
  const state = { created: null };
  return {
    state,
    async create(data) {
      state.created = data;
      return {
        id: 1n,
        ...data,
        created_at: new Date("2026-10-05T03:00:00.000Z"),
        user: null,
      };
    },
    async findAll() {
      return {
        total: 1,
        page: 1,
        limit: 20,
        logs: [
          {
            id: 1n,
            user_id: 8,
            user: null,
            action: "VIEW",
            resource: "MEDICAL_RECORD",
            resource_id: "42",
            ip_address: "127.0.0.1",
            created_at: new Date("2026-10-05T03:00:00.000Z"),
          },
        ],
      };
    },
  };
}

test("AuditLogService masks secrets and attaches trusted request context", async () => {
  const repository = createRepository();
  const service = new AuditLogService({ repository, logger: null });

  const result = await runWithRequestContext(
    {
      requestId: "req-1",
      ipAddress: "::ffff:127.0.0.1",
      userAgent: "Audit Test/1.0",
      method: "PATCH",
      path: "/api/users/9/status",
    },
    () =>
      service.create({
        userId: 8,
        action: "LOCK_USER",
        resource: "USER",
        resourceId: 9,
        oldValue: { is_active: true, password: "never-store-me" },
        newValue: {
          is_active: false,
          nested: { accessToken: "access-secret", otp: "123456" },
        },
        metadata: {
          authorization: "Bearer secret",
          vnp_SecureHash: "hash-secret",
        },
      }),
  );

  assert.equal(result.id, "1");
  assert.equal(repository.state.created.ip_address, "127.0.0.1");
  assert.equal(repository.state.created.user_agent, "Audit Test/1.0");
  assert.equal(repository.state.created.old_value.password, "[REDACTED]");
  assert.equal(repository.state.created.new_value.nested.accessToken, "[REDACTED]");
  assert.equal(repository.state.created.new_value.nested.otp, "[REDACTED]");
  assert.equal(repository.state.created.metadata.authorization, "[REDACTED]");
  assert.equal(repository.state.created.metadata.vnp_SecureHash, "[REDACTED]");
  assert.deepEqual(repository.state.created.metadata.request, {
    requestId: "req-1",
    method: "PATCH",
    path: "/api/users/9/status",
  });
});

test("AuditLogService.record never breaks the business operation", async () => {
  const errors = [];
  const service = new AuditLogService({
    repository: {
      async create() {
        throw Object.assign(new Error("database unavailable"), { code: "DB_DOWN" });
      },
    },
    logger: { error: (...args) => errors.push(args) },
  });

  const result = await service.record({
    userId: 1,
    action: "UPDATE",
    resource: "USER",
    resourceId: 2,
  });

  assert.equal(result, null);
  assert.equal(errors.length, 1);
});

test("AuditLogService list is lightweight and serializes bigint ids", async () => {
  const service = new AuditLogService({ repository: createRepository() });
  const result = await service.getAll({ page: 1, limit: 20 });

  assert.equal(result.data[0].id, "1");
  assert.equal(result.total_pages, 1);
  assert.equal(Object.hasOwn(result.data[0], "oldValue"), false);
  assert.equal(Object.hasOwn(result.data[0], "metadata"), false);
});

test("Audit Log query validator enforces filters, pagination and date order", () => {
  const parsed = queryAuditLogSchema.parse({
    page: "2",
    limit: "50",
    userId: "7",
    action: "VIEW",
    resource: "LAB_RESULT",
    dateFrom: "2026-10-01",
    dateTo: "2026-10-05",
    sortOrder: "asc",
  });

  assert.equal(parsed.page, 2);
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.userId, 7);
  assert.equal(parsed.dateFrom.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(parsed.dateTo.toISOString(), "2026-10-05T23:59:59.999Z");
  assert.throws(() => queryAuditLogSchema.parse({ limit: "101" }));
  assert.throws(() =>
    queryAuditLogSchema.parse({
      dateFrom: "2026-10-06",
      dateTo: "2026-10-05",
    }),
  );
});

test("Audit Log authorization allows only Admin", () => {
  const middleware = authorize("Admin");
  let nextCalled = false;
  let statusCode = null;
  let body = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };

  middleware({ user: { role: { name: "Doctor" } } }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.equal(body.success, false);

  middleware({ user: { role: { name: "Admin" } } }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test("Audit Log router exposes read-only GET endpoints", () => {
  const methods = auditLogRoutes.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods));

  assert.deepEqual([...new Set(methods)], ["get"]);
});
