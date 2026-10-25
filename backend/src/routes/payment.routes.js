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

router.post(
  "/clinical/:orderId/create",
  verifyAccessTokenMiddleware,
  authorize("Patient"),
  paymentController.createClinicalPaymentUrl,
);

router.get(
  "/clinical/:orderId/status",
  verifyAccessTokenMiddleware,
  authorize("Patient", "Admin"),
  paymentController.getClinicalPaymentStatus,
);

// GET /api/payments/:invoiceId/status - Kiểm tra trạng thái thanh toán hóa đơn
router.get(
  "/:invoiceId/status",
  verifyAccessTokenMiddleware,
  authorize("Patient", "Admin"),
  paymentController.getPaymentStatus,
);

// POST /api/payments/mock-complete/:invoiceId - Xác nhận thanh toán giả lập (Mock mode)
router.post(
  "/mock-complete/:invoiceId",
  verifyAccessTokenMiddleware,
  authorize("Patient", "Admin"),
  paymentController.mockCompletePayment,
);

router.post(
  "/mock-fail/:invoiceId",
  verifyAccessTokenMiddleware,
  authorize("Patient", "Admin"),
  paymentController.mockFailPayment,
);

router.post("/mock-complete-clinical/:orderId", verifyAccessTokenMiddleware, authorize("Patient", "Admin"), paymentController.mockCompleteClinicalPayment);
router.post("/mock-fail-clinical/:orderId", verifyAccessTokenMiddleware, authorize("Patient", "Admin"), paymentController.mockFailClinicalPayment);

export default router;
