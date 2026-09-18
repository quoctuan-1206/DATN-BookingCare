import axiosClient from "../api/axios";

export const LAB_STATUS_LABEL = {
  PENDING: "Chờ thực hiện",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

const labService = {
  getPublicTests: async (params = {}) => {
    const response = await axiosClient.get("/labs/catalog", { params });
    return response.data?.data || [];
  },
  getPublicTest: async (id) => {
    const response = await axiosClient.get(`/labs/catalog/${id}`);
    return response.data?.data;
  },
  getAvailableSchedules: async (params = {}) => {
    const response = await axiosClient.get("/labs/schedules/available", { params });
    return response.data || { data: [], pagination: {} };
  },
  getTests: async (params = {}) => {
    const response = await axiosClient.get("/labs/tests", { params });
    return response.data?.data || [];
  },
  createTest: (payload) => axiosClient.post("/labs/tests", payload),
  updateTest: (id, payload) => axiosClient.put(`/labs/tests/${id}`, payload),
  getSchedules: async (params = {}) => {
    const response = await axiosClient.get("/labs/schedules", { params });
    return response.data || { data: [], pagination: {} };
  },
  createSchedule: (payload) => axiosClient.post("/labs/schedules", payload),
  updateSchedule: (id, payload) => axiosClient.put(`/labs/schedules/${id}`, payload),
  deleteSchedule: (id) => axiosClient.delete(`/labs/schedules/${id}`),
  getOrders: async (params = {}) => {
    const response = await axiosClient.get("/labs/orders", { params });
    return response.data || { data: [], pagination: {} };
  },
  getOrder: async (id) => {
    const response = await axiosClient.get(`/labs/orders/${id}`);
    return response.data?.data;
  },
  createOrder: (payload) => axiosClient.post("/labs/orders", payload),
  createPatientOrder: (payload) => axiosClient.post("/labs/orders/self", payload),
  updateOrderStatus: (id, status) =>
    axiosClient.patch(`/labs/orders/${id}/status`, { status }),
  updateResult: (orderId, resultId, payload) =>
    axiosClient.put(`/labs/orders/${orderId}/results/${resultId}`, payload),
  uploadResultFile: (orderId, file) => {
    const formData = new FormData();
    formData.append("result_file", file);
    return axiosClient.post(`/labs/orders/${orderId}/result-file`, formData);
  },
  getResultFileBlob: (orderId) =>
    axiosClient.get(`/labs/orders/${orderId}/result-file`, {
      responseType: "blob",
    }),
  downloadResultFile: async (order) => {
    const response = await labService.getResultFileBlob(order.id);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = order.result_file?.name || `ket-qua-xet-nghiem-${order.id}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};

export default labService;
