import notificationService from "../services/notification.service.js";
import {
  queryNotificationSchema,
  createNotificationSchema,
} from "../validators/notification.validator.js";

class NotificationController {
  // Lấy danh sách thông báo của tôi (GET /api/notifications)
  async getMyNotifications(req, res, next) {
    try {
      const query = queryNotificationSchema.parse(req.query);
      const result = await notificationService.getMyNotifications(
        req.user,
        query,
      );

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách thông báo thành công",
        unread_count: result.unread_count,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          total_pages: result.total_pages,
        },
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy số thông báo chưa đọc (GET /api/notifications/unread-count)
  async getUnreadCount(req, res, next) {
    try {
      const data = await notificationService.getUnreadCount(req.user);
      return res.status(200).json({
        success: true,
        message: "Lấy số thông báo chưa đọc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Đánh dấu một thông báo đã đọc (PATCH /api/notifications/:id/read)
  async markRead(req, res, next) {
    try {
      const data = await notificationService.markRead(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        message: "Đã đánh dấu đã đọc",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Đánh dấu tất cả thông báo đã đọc (PATCH /api/notifications/read-all)
  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllRead(req.user);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin gửi thông báo tới 1 user (POST /api/notifications)
  async create(req, res, next) {
    try {
      const validated = createNotificationSchema.parse(req.body);
      const data = await notificationService.createByAdmin(validated);
      return res.status(201).json({
        success: true,
        message: "Đã gửi thông báo",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
