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

  // Tính điểm trung bình và tổng đánh giá của bác sĩ
  async getStatsByDoctorId(doctorId) {
    const result = await prisma.reviews.aggregate({
      where: { doctor_id: doctorId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      average_rating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
      total_reviews: result._count.id,
    };
  }
}

export default new ReviewRepository();
