import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// 1. Các endpoint public tiếp nhận callback từ cổng thanh toán VNPAY
router.get("/vnpay/ipn", paymentController.handleIpn);
router.get("/vnpay/return", paymentController.handleReturn);

// 2. Các endpoint yêu cầu xác thực người dùng
// POST /api/payments/vnpay/:invoiceId/create - Bệnh nhân tạo link thanh toán
router.post(
  "/vnpay/:invoiceId/create",
  verifyAccessTokenMiddleware,
  authorize("Patient"),
  paymentController.createPaymentUrl,
);

// GET /api/payments/:invoiceId/status - Kiểm tra trạng thái thanh toán hóa đơn
router.get(
  "/:invoiceId/status",
  verifyAccessTokenMiddleware,
  authorize("Patient", "Admin"),
  paymentController.getPaymentStatus,
);

export default router;
