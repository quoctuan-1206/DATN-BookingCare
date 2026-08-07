import prisma from "../config/prisma.js";

class NotificationRepository {
  // Lấy danh sách thông báo của user kèm phân trang
  async findByUserId(userId, { unread_only, page = 1, limit = 30 }) {
    const skip = (page - 1) * limit;
    const where = { user_id: Number(userId) };
    if (unread_only) where.is_read = false;

    const [total, unread_count, notifications] = await prisma.$transaction([
      prisma.notifications.count({ where }),
      prisma.notifications.count({
        where: { user_id: Number(userId), is_read: false },
      }),
      prisma.notifications.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
    ]);

    return { total, unread_count, notifications, page, limit };
  }

  // Lấy chi tiết 1 thông báo theo ID
  async findById(id) {
    return prisma.notifications.findFirst({
      where: { id: Number(id) },
    });
  }

  // Tạo thông báo mới
  async create(data) {
    return prisma.notifications.create({
      data: {
        user_id: Number(data.user_id),
        title: data.title,
        content: data.content,
        link: data.link || null,
        type: data.type || null,
        is_read: false,
      },
    });
  }

  // Tạo nhiều thông báo cùng lúc
  async createMany(items) {
    if (!items.length) return { count: 0 };
    return prisma.notifications.createMany({ data: items });
  }

  // Đánh dấu 1 thông báo đã đọc
  async markRead(id, userId) {
    return prisma.notifications.updateMany({
      where: { id: Number(id), user_id: Number(userId) },
      data: { is_read: true },
    });
  }

  // Đánh dấu tất cả thông báo của user đã đọc
  async markAllRead(userId) {
    return prisma.notifications.updateMany({
      where: { user_id: Number(userId), is_read: false },
      data: { is_read: true },
    });
  }

  // Đếm số thông báo chưa đọc của user
  async countUnread(userId) {
    return prisma.notifications.count({
      where: { user_id: Number(userId), is_read: false },
    });
  }
}

export default new NotificationRepository();
