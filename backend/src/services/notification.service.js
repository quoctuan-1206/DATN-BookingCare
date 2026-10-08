import notificationRepository from "../repositories/notification.repository.js";
import { publishNotification } from "../realtime/notification-stream.js";

class NotificationService {
  // Chuẩn hóa định dạng dữ liệu thông báo trả về cho API
  format(notification) {
    if (!notification) return null;
    return {
      id: notification.id,
      user_id: notification.user_id,
      title: notification.title,
      content: notification.content,
      link: notification.link || null,
      type: notification.type || "SYSTEM",
      is_read: notification.is_read === true,
      created_at: notification.created_at,
    };
  }

  // Tạo thông báo cho 1 người dùng (helper nội bộ)
  async notify(userId, { title, content, link = null, type = "SYSTEM" }) {
    if (!userId) return null;
    const created = await notificationRepository.create({
      user_id: userId,
      title,
      content,
      link,
      type,
    });
    const formatted = this.format(created);
    publishNotification(userId, formatted);
    return formatted;
  }

  async notifyOnce(userId, payload) {
    if (!userId) return null;
    const existing = await notificationRepository.findDuplicate({
      user_id: userId,
      type: payload.type || "SYSTEM",
      link: payload.link || null,
    });
    if (existing) return this.format(existing);
    return this.notify(userId, payload);
  }

  // Tạo thông báo hàng loạt cho nhiều người dùng
  async notifyMany(userIds, payload) {
    const uniqueIds = [...new Set(userIds.filter(Boolean).map(Number))];
    if (!uniqueIds.length) return;

    await notificationRepository.createMany(
      uniqueIds.map((user_id) => ({
        user_id,
        title: payload.title,
        content: payload.content,
        link: payload.link || null,
        type: payload.type || "SYSTEM",
        is_read: false,
      })),
    );

    for (const userId of uniqueIds) publishNotification(userId, null);
  }

  // Lấy danh sách thông báo của người dùng hiện tại
  async getMyNotifications(user, query) {
    const result = await notificationRepository.findByUserId(user.id, query);
    return {
      total: result.total,
      unread_count: result.unread_count,
      page: result.page,
      limit: result.limit,
      total_pages: Math.ceil(result.total / result.limit) || 0,
      data: result.notifications.map((n) => this.format(n)),
    };
  }

  // Đếm số thông báo chưa đọc
  async getUnreadCount(user) {
    const count = await notificationRepository.countUnread(user.id);
    return { unread_count: count };
  }

  // Đánh dấu 1 thông báo đã đọc
  async markRead(user, id) {
    const existing = await notificationRepository.findById(id);
    if (!existing || Number(existing.user_id) !== Number(user.id)) {
      const error = new Error("Không tìm thấy thông báo");
      error.statusCode = 404;
      throw error;
    }

    await notificationRepository.markRead(id, user.id);
    const updated = await notificationRepository.findById(id);
    return this.format(updated);
  }

  // Đánh dấu tất cả thông báo đã đọc
  async markAllRead(user) {
    await notificationRepository.markAllRead(user.id);
    return { message: "Đã đánh dấu tất cả là đã đọc" };
  }

  // Tạo thông báo bởi Admin
  async createByAdmin(data) {
    return this.notify(data.user_id, data);
  }
}

export default new NotificationService();
