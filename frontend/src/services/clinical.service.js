import axiosClient from "../api/axios";

function responseData(response) {
  return response.data?.data;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const clinicalService = {
  getPublicServices: async (params = {}) => {
    const response = await axiosClient.get("/clinical/catalog", { params });
    return responseData(response) || [];
  },

  getPublicService: async (id) => {
    const response = await axiosClient.get(`/clinical/catalog/${id}`);
    return responseData(response);
  },

  getAvailableSchedules: async (params = {}) => {
    const response = await axiosClient.get("/clinical/schedules/available", {
      params,
    });
    return response.data || { data: [], pagination: {} };
  },

  createPatientOrder: async (payload) => {
    const response = await axiosClient.post("/clinical/orders/self", payload);
    return responseData(response);
  },

  getServices: async (params = {}) => {
    const response = await axiosClient.get("/clinical/services", { params });
    return response.data || { data: [], pagination: {} };
  },

  getService: async (id) => {
    const response = await axiosClient.get(`/clinical/services/${id}`);
    return responseData(response);
  },

  getStatistics: async () => {
    const response = await axiosClient.get("/clinical/stats");
    return responseData(response) || {
      total_orders: 0,
      by_status: {},
      by_service_type: {},
    };
  },

  createService: async (payload) => {
    const response = await axiosClient.post("/clinical/services", payload);
    return responseData(response);
  },

  updateService: async (id, payload) => {
    const response = await axiosClient.put(`/clinical/services/${id}`, payload);
    return responseData(response);
  },

  deactivateService: async (id) => {
    const response = await axiosClient.delete(`/clinical/services/${id}`);
    return responseData(response);
  },

  getSchedules: async (params = {}) => {
    const response = await axiosClient.get("/clinical/schedules", { params });
    return response.data || { data: [], pagination: {} };
  },

  createSchedule: async (payload) => {
    const response = await axiosClient.post("/clinical/schedules", payload);
    return responseData(response);
  },

  updateSchedule: async (id, payload) => {
    const response = await axiosClient.put(`/clinical/schedules/${id}`, payload);
    return responseData(response);
  },

  deleteSchedule: async (id) => {
    const response = await axiosClient.delete(`/clinical/schedules/${id}`);
    return responseData(response);
  },

  getOrders: async (params = {}) => {
    const response = await axiosClient.get("/clinical/orders", { params });
    return response.data || { data: [], pagination: {} };
  },

  getOrderStats: async () => {
    const [all, pending, inProgress, completed] = await Promise.all([
      axiosClient.get("/clinical/orders", { params: { page: 1, limit: 1 } }),
      axiosClient.get("/clinical/orders", { params: { page: 1, limit: 1, status: "PENDING" } }),
      axiosClient.get("/clinical/orders", { params: { page: 1, limit: 1, status: "IN_PROGRESS" } }),
      axiosClient.get("/clinical/orders", { params: { page: 1, limit: 1, status: "COMPLETED" } }),
    ]);
    return {
      total: Number(all.data?.pagination?.total || 0),
      pending: Number(pending.data?.pagination?.total || 0),
      in_progress: Number(inProgress.data?.pagination?.total || 0),
      completed: Number(completed.data?.pagination?.total || 0),
    };
  },

  getOrder: async (id) => {
    const response = await axiosClient.get(`/clinical/orders/${id}`);
    return responseData(response);
  },

  createOrder: async (payload) => {
    const response = await axiosClient.post("/clinical/orders", payload);
    return responseData(response);
  },

  updateOrderStatus: async (id, payload) => {
    const body = typeof payload === "string" ? { status: payload } : payload;
    const response = await axiosClient.patch(`/clinical/orders/${id}/status`, body);
    return responseData(response);
  },

  createResult: async (orderId, payload) => {
    const response = await axiosClient.post(`/clinical/orders/${orderId}/results`, payload);
    return responseData(response);
  },

  getResult: async (id) => {
    const response = await axiosClient.get(`/clinical/results/${id}`);
    return responseData(response);
  },

  updateResult: async (orderId, resultId, payload) => {
    const response = await axiosClient.put(
      `/clinical/orders/${orderId}/results/${resultId}`,
      payload,
    );
    return responseData(response);
  },

  getAttachments: async (orderId) => {
    const response = await axiosClient.get(`/clinical/orders/${orderId}/attachments`);
    return responseData(response) || [];
  },

  uploadAttachment: async (orderId, file) => {
    const formData = new FormData();
    formData.append("attachment", file);
    const response = await axiosClient.post(
      `/clinical/orders/${orderId}/attachments`,
      formData,
      { timeout: 60000 },
    );
    return responseData(response);
  },

  deleteAttachment: async (id) => {
    const response = await axiosClient.delete(`/clinical/attachments/${id}`);
    return responseData(response);
  },

  getAttachmentBlob: async (id, download = false) => {
    try {
      return await axiosClient.get(`/clinical/attachments/${id}/file`, {
        params: download ? { download: "true" } : undefined,
        responseType: "blob",
        timeout: 60000,
      });
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await error.response.data.text());
          error.response.data = body;
        } catch {
          // Giữ nguyên lỗi mạng khi response không phải JSON.
        }
      }
      throw error;
    }
  },

  openAttachment: async (attachment) => {
    const previewable =
      attachment.mime_type?.startsWith("image/") ||
      attachment.mime_type?.startsWith("video/") ||
      attachment.mime_type === "application/pdf";

    if (!previewable) {
      return clinicalService.downloadAttachment(attachment);
    }

    const previewWindow = window.open("", "_blank");
    try {
      const response = await clinicalService.getAttachmentBlob(attachment.id);
      const url = URL.createObjectURL(response.data);
      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.href = url;
      } else {
        saveBlob(response.data, attachment.name || `tep-can-lam-sang-${attachment.id}`);
        URL.revokeObjectURL(url);
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      previewWindow?.close();
      throw error;
    }
  },

  downloadAttachment: async (attachment) => {
    const response = await clinicalService.getAttachmentBlob(attachment.id, true);
    saveBlob(response.data, attachment.name || `tep-can-lam-sang-${attachment.id}`);
  },

  getOrderEvents: async (orderId) => {
    const response = await axiosClient.get(`/clinical/orders/${orderId}/events`);
    return responseData(response) || [];
  },
};

export default clinicalService;
