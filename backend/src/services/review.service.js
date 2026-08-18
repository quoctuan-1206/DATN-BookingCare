import reviewRepository from "../repositories/review.repository.js";
import appointmentRepository from "../repositories/appointment.repository.js";
import notificationService from "./notification.service.js";

class ReviewService {
  // Chuẩn hóa dữ liệu đánh giá trả về cho API
  formatReview(review) {
    if (!review) return null;

    const doctor = review.users;
    const doctorName = doctor
      ? [doctor.last_name, doctor.first_name].filter(Boolean).join(" ").trim()
      : null;

    return {
      id: review.id,
      doctor_id: review.doctor_id,
      doctor_name: doctorName,
      doctor_avatar: doctor?.avatar || null,
      patient_profile_id: review.patient_profile_id,
      patient_name: review.patient_profiles?.full_name || null,
      account_id: review.patient_profiles?.account_id || null,
      appointment_id: review.appointment_id,
      booking_code: review.appointments?.booking_code || null,
      rating: review.rating,
      comment: review.comment || null,
      created_at: review.created_at,
    };
  }

  // Lấy danh sách đánh giá (theo doctor_id nếu có)
  async getReviews(query) {
    const where = {};
    if (query.doctor_id) where.doctor_id = query.doctor_id;

    const { total, reviews, page, limit } = await reviewRepository.findAll(where, query);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: reviews.map((r) => this.formatReview(r)),
    };
  }

  // Lấy chi tiết 1 đánh giá
  async getReviewById(id) {
    const reviewId = this.parseId(id);
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      const error = new Error("Không tìm thấy đánh giá");
      error.statusCode = 404;
      throw error;
    }

    return this.formatReview(review);
  }

  // Lấy đánh giá theo appointment_id
  async getReviewByAppointmentId(appointmentId) {
    const id = this.parseId(appointmentId);
    const review = await reviewRepository.findByAppointmentId(id);
    return review ? this.formatReview(review) : null;
  }

  // Lấy thống kê đánh giá của bác sĩ
  async getDoctorStats(doctorId) {
    const id = this.parseId(doctorId);
    return reviewRepository.getStatsByDoctorId(id);
  }

  // Tạo đánh giá — chỉ Patient có appointment COMPLETED mới được tạo
  async createReview(user, data) {
    if (user.role?.name !== "Patient") {
      const error = new Error("Chỉ bệnh nhân mới được đánh giá");
      error.statusCode = 403;
      throw error;
    }

    const appointment = await appointmentRepository.findById(data.appointment_id);

    if (!appointment) {
      const error = new Error("Không tìm thấy lịch hẹn");
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status !== "COMPLETED") {
      const error = new Error("Chỉ được đánh giá lịch hẹn đã hoàn thành");
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra lịch hẹn thuộc bệnh nhân đang đăng nhập
    if (Number(appointment.patient_profiles?.account_id) !== Number(user.id)) {
      const error = new Error("Lịch hẹn không thuộc tài khoản của bạn");
      error.statusCode = 403;
      throw error;
    }

    // Kiểm tra đã đánh giá chưa
    const existing = await reviewRepository.findByAppointmentId(data.appointment_id);
    if (existing) {
      const error = new Error("Bạn đã đánh giá lịch hẹn này rồi");
      error.statusCode = 409;
      throw error;
    }

    // Lấy doctor_id và patient_profile_id từ appointment
    const doctorId =
      appointment.schedules?.doctor_workplaces?.doctor_id ||
      appointment.schedules?.doctor_workplaces?.doctor_profiles?.users?.id;
    const patientProfileId = appointment.patient_profile_id;

    if (!doctorId) {
      const error = new Error("Không xác định được bác sĩ của lịch hẹn");
      error.statusCode = 400;
      throw error;
    }

    const review = await reviewRepository.create({
      doctor_id: doctorId,
      patient_profile_id: patientProfileId,
      appointment_id: data.appointment_id,
      rating: data.rating,
      comment: data.comment || null,
    });

    // Gửi thông báo cho bác sĩ
    try {
      const patientName = appointment.patient_profiles?.full_name || "Bệnh nhân";
      await notificationService.notify(doctorId, {
        title: "Đánh giá mới",
        content: `${patientName} đã đánh giá ${data.rating} sao cho lịch hẹn ${appointment.booking_code || ""}.`,
        link: "/doctor/reviews",
        type: "REVIEW",
      });
    } catch {
      // Không chặn tạo review nếu gửi thông báo lỗi
    }

    return this.formatReview(review);
  }

  // Cập nhật đánh giá (chỉ chủ đánh giá)
  async updateReview(user, id, data) {
    const reviewId = this.parseId(id);
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      const error = new Error("Không tìm thấy đánh giá");
      error.statusCode = 404;
      throw error;
    }

    if (Number(review.patient_profiles?.account_id) !== Number(user.id)) {
      const error = new Error("Bạn không có quyền sửa đánh giá này");
      error.statusCode = 403;
      throw error;
    }

    const updateData = {};
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.comment !== undefined) updateData.comment = data.comment;

    const updated = await reviewRepository.update(reviewId, updateData);
    return this.formatReview(updated);
  }

  // Xóa đánh giá (chủ đánh giá hoặc Admin)
  async deleteReview(user, id) {
    const reviewId = this.parseId(id);
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      const error = new Error("Không tìm thấy đánh giá");
      error.statusCode = 404;
      throw error;
    }

    const isOwner = Number(review.patient_profiles?.account_id) === Number(user.id);
    const isAdmin = user.role?.name === "Admin";

    if (!isOwner && !isAdmin) {
      const error = new Error("Bạn không có quyền xóa đánh giá này");
      error.statusCode = 403;
      throw error;
    }

    await reviewRepository.delete(reviewId);
    return { message: "Đã xóa đánh giá" };
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      const error = new Error("ID không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return n;
  }
}

export default new ReviewService();
