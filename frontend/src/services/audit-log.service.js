import axiosClient from "../api/axios";

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 20,
  total_pages: 0,
};

export const auditLogService = {
  async getAuditLogs(params = {}, options = {}) {
    const response = await axiosClient.get("/admin/audit-logs", {
      params,
      signal: options.signal,
    });
    const payload = response.data || {};

    const serverPagination = payload.pagination || {};
    return {
      ...payload,
      data: Array.isArray(payload.data) ? payload.data : [],
      pagination: {
        ...DEFAULT_PAGINATION,
        ...serverPagination,
        total_pages:
          serverPagination.total_pages ?? serverPagination.totalPages ?? 0,
      },
    };
  },

  async getAuditLogById(id, options = {}) {
    const response = await axiosClient.get(`/admin/audit-logs/${id}`, {
      signal: options.signal,
    });
    return response.data?.data || null;
  },
};

export default auditLogService;
