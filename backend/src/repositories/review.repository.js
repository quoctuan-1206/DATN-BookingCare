import prisma from "../config/prisma.js";

const reviewInclude = {
  users: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      avatar: true,
    },
  },
  patient_profiles: {
    select: {
      id: true,
      full_name: true,
      account_id: true,
    },
  },
  appointments: {
    select: {
      id: true,
      booking_code: true,
      status: true,
    },
  },
};

class ReviewRepository {
  // Lấy danh sách đánh giá kèm phân trang
  async findAll(where, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [total, reviews] = await prisma.$transaction([
      prisma.reviews.count({ where }),
      prisma.reviews.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: reviewInclude,
      }),
    ]);

    return { total, reviews, page, limit };
  }

  // Tìm đánh giá theo ID
  async findById(id) {
    return prisma.reviews.findUnique({
      where: { id },
      include: reviewInclude,
    });
  }

  // Tìm đánh giá theo appointment_id (unique)
  async findByAppointmentId(appointmentId) {
    return prisma.reviews.findUnique({
      where: { appointment_id: appointmentId },
      include: reviewInclude,
    });
  }

  // Tạo đánh giá mới
  async create(data) {
    return prisma.reviews.create({
      data,
      include: reviewInclude,
    });
  }

  // Cập nhật đánh giá
  async update(id, data) {
    return prisma.reviews.update({
      where: { id },
      data,
      include: reviewInclude,
    });
  }

  // Xóa đánh giá
  async delete(id) {
    return prisma.reviews.delete({ where: { id } });
  }

  // Tính điểm trung bình, tổng và phân bố sao của bác sĩ
  async getStatsByDoctorId(doctorId) {
    const id = Number(doctorId);
    const where = { doctor_id: id };

    const [result, grouped] = await Promise.all([
      prisma.reviews.aggregate({
        where,
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.reviews.groupBy({
        by: ["rating"],
        where: { ...where, rating: { not: null } },
        _count: { rating: true },
      }),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of grouped) {
      const star = Number(row.rating);
      if (star >= 1 && star <= 5) {
        distribution[star] = row._count.rating;
      }
    }

    return {
      average_rating: result._avg.rating
        ? Math.round(result._avg.rating * 10) / 10
        : 0,
      total_reviews: result._count.id,
      distribution,
    };
  }
}

export default new ReviewRepository();
