import paymentService from "../services/payment.service.js";

class PaymentController {
  // Tạo link thanh toán VNPAY (POST /api/payments/vnpay/:invoiceId/create)
  async createPaymentUrl(req, res, next) {
    try {
      const clientIp = req.ip || req.connection?.remoteAddress;
      const data = await paymentService.createPaymentUrl(
        req.user,
        req.params.invoiceId,
        clientIp,
      );

      return res.status(200).json({
        success: true,
        message: "Tạo link thanh toán thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tra cứu trạng thái thanh toán (GET /api/payments/:invoiceId/status)
  async getPaymentStatus(req, res, next) {
    try {
      const data = await paymentService.getPaymentStatus(
        req.user,
        req.params.invoiceId,
      );

      return res.status(200).json({
        success: true,
        message: "Lấy trạng thái thanh toán thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Nhận thông báo giao dịch IPN từ VNPAY (GET /api/payments/vnpay/ipn)
  async handleIpn(req, res) {
    try {
      const response = await paymentService.handleIpn(req.query);
      return res.status(200).json(response);
    } catch (error) {
      console.error("[PaymentController] Lỗi xử lý IPN:", error);
      return res.status(200).json({
        RspCode: "99",
        Message: "Unknown error",
      });
    }
  }

  // Điều hướng người dùng sau khi thanh toán VNPAY (GET /api/payments/vnpay/return)
  async handleReturn(req, res) {
    try {
      const redirectUrl = await paymentService.handleReturn(req.query);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("[PaymentController] Lỗi xử lý return URL:", error);
      const frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:5173"
      ).replace(/\/$/, "");
      return res.redirect(`${frontendUrl}/payment/result?status=error`);
    }
  }
}

export default new PaymentController();
