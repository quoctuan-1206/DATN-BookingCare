import { Router } from "express";
import notificationController from "../controllers/notification.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Patient / Doctor / Admin: thông báo của chính mình
router.use(
  verifyAccessTokenMiddleware,
  authorize("Patient", "Doctor", "Admin"),
);

// GET /api/notifications - Danh sách thông báo
router.get("/", notificationController.getMyNotifications);
// GET /api/notifications/unread-count - Số chưa đọc
router.get("/unread-count", notificationController.getUnreadCount);
// PATCH /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.patch("/read-all", notificationController.markAllRead);
// PATCH /api/notifications/:id/read - Đánh dấu một thông báo đã đọc
router.patch("/:id/read", notificationController.markRead);

// Chỉ Admin: gửi thông báo tới 1 user
router.post("/", authorize("Admin"), notificationController.create);

export default router;
