import test from "node:test";
import assert from "node:assert/strict";
import axiosClient from "../api/axios.js";
import { auditLogService } from "./audit-log.service.js";

test("getAuditLogs forwards filters and normalizes the list envelope", async () => {
  const originalGet = axiosClient.get;
  const signal = new AbortController().signal;
  let request = null;

  axiosClient.get = async (url, config) => {
    request = { url, config };
    return {
      data: {
        success: true,
        data: [{ id: 7, action: "VIEW", resource: "MEDICAL_RECORD" }],
        pagination: { total: 1, page: 2, limit: 20, total_pages: 3 },
      },
    };
  };

  try {
    const params = {
      page: 2,
      limit: 20,
      action: "VIEW",
      sortOrder: "desc",
    };
    const result = await auditLogService.getAuditLogs(params, { signal });

    assert.equal(request.url, "/admin/audit-logs");
    assert.deepEqual(request.config.params, params);
    assert.equal(request.config.signal, signal);
    assert.equal(result.data[0].id, 7);
    assert.equal(result.pagination.total_pages, 3);
  } finally {
    axiosClient.get = originalGet;
  }
});

test("getAuditLogs supplies safe defaults for a malformed empty payload", async () => {
  const originalGet = axiosClient.get;
  axiosClient.get = async () => ({ data: { success: true, data: null } });

  try {
    const result = await auditLogService.getAuditLogs();
    assert.deepEqual(result.data, []);
    assert.deepEqual(result.pagination, {
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 0,
    });
  } finally {
    axiosClient.get = originalGet;
  }
});

test("getAuditLogById calls the detail endpoint and returns its data", async () => {
  const originalGet = axiosClient.get;
  let request = null;

  axiosClient.get = async (url, config) => {
    request = { url, config };
    return {
      data: {
        success: true,
        data: { id: 12, action: "UPDATE", resource: "USER" },
      },
    };
  };

  try {
    const result = await auditLogService.getAuditLogById(12);
    assert.equal(request.url, "/admin/audit-logs/12");
    assert.equal(result.id, 12);
  } finally {
    axiosClient.get = originalGet;
  }
});
