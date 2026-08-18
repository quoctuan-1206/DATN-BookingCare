import { Router } from "express";
import reviewController from "../controllers/review.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public: lấy danh sách đánh giá (lọc theo doctor_id)
router.get("/", optionalAuth, reviewController.getReviews);

// Public: thống kê đánh giá của bác sĩ
router.get("/doctor/:doctorId/stats", reviewController.getDoctorStats);

// Auth: lấy đánh giá theo lịch hẹn
router.get(
  "/appointment/:appointmentId",
  verifyAccessTokenMiddleware,
  reviewController.getByAppointment,
);

// Auth: lấy chi tiết đánh giá
router.get("/:id", verifyAccessTokenMiddleware, reviewController.getReviewById);

// Patient: tạo đánh giá
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Patient"),
  reviewController.createReview,
);

// Patient: sửa đánh giá
router.patch(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Patient"),
  reviewController.updateReview,
);

// Patient hoặc Admin: xóa đánh giá
router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Patient", "Admin"),
  reviewController.deleteReview,
);

export default router;
