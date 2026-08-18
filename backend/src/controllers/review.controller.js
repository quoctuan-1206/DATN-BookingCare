import reviewService from "../services/review.service.js";
import {
  createReviewSchema,
  updateReviewSchema,
  queryReviewSchema,
} from "../validators/review.validator.js";

class ReviewController {
  // Lấy danh sách đánh giá (GET /api/reviews)
  async getReviews(req, res, next) {
    try {
      const query = queryReviewSchema.parse(req.query);
      const result = await reviewService.getReviews(query);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách đánh giá thành công",
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

  // Lấy chi tiết đánh giá (GET /api/reviews/:id)
  async getReviewById(req, res, next) {
    try {
      const data = await reviewService.getReviewById(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết đánh giá thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy đánh giá theo lịch hẹn (GET /api/reviews/appointment/:appointmentId)
  async getByAppointment(req, res, next) {
    try {
      const data = await reviewService.getReviewByAppointmentId(req.params.appointmentId);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy thống kê đánh giá của bác sĩ (GET /api/reviews/doctor/:doctorId/stats)
  async getDoctorStats(req, res, next) {
    try {
      const data = await reviewService.getDoctorStats(req.params.doctorId);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo đánh giá (POST /api/reviews)
  async createReview(req, res, next) {
    try {
      const validated = createReviewSchema.parse(req.body);
      const data = await reviewService.createReview(req.user, validated);
      return res.status(201).json({
        success: true,
        message: "Đánh giá thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Sửa đánh giá (PATCH /api/reviews/:id)
  async updateReview(req, res, next) {
    try {
      const validated = updateReviewSchema.parse(req.body);
      const data = await reviewService.updateReview(req.user, req.params.id, validated);
      return res.status(200).json({
        success: true,
        message: "Cập nhật đánh giá thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa đánh giá (DELETE /api/reviews/:id)
  async deleteReview(req, res, next) {
    try {
      const data = await reviewService.deleteReview(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        message: data.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
