import axiosClient from "../api/axios.js";

export const paymentService = {
  // Tạo link thanh toán VNPAY
  async createPaymentUrl(invoiceId) {
    const res = await axiosClient.post(`/payments/vnpay/${invoiceId}/create`);
    return res.data?.data;
  },

  // Lấy trạng thái thanh toán hóa đơn
  async getStatus(invoiceId) {
    const res = await axiosClient.get(`/payments/${invoiceId}/status`);
    return res.data?.data;
  },

  async createClinicalPaymentUrl(orderId) {
    const res = await axiosClient.post(`/payments/clinical/${orderId}/create`);
    return res.data?.data;
  },

  async getClinicalStatus(orderId) {
    const res = await axiosClient.get(`/payments/clinical/${orderId}/status`);
    return res.data?.data;
  },

  // Giả lập hoàn tất thanh toán (Mock mode)
  async mockComplete(invoiceId) {
    const res = await axiosClient.post(`/payments/mock-complete/${invoiceId}`);
    return res.data?.data;
  },

  async mockFail(invoiceId) {
    const res = await axiosClient.post(`/payments/mock-fail/${invoiceId}`);
    return res.data?.data;
  },

  async mockCompleteClinical(orderId) {
    const res = await axiosClient.post(`/payments/mock-complete-clinical/${orderId}`);
    return res.data?.data;
  },

  async mockFailClinical(orderId) {
    const res = await axiosClient.post(`/payments/mock-fail-clinical/${orderId}`);
    return res.data?.data;
  },
};

export default paymentService;
