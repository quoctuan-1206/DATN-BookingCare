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
};

export default paymentService;
