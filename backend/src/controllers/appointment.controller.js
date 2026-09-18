import appointmentService from "../services/appointment.service.js";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  queryAppointmentSchema,
} from "../validators/appointment.validator.js";

class AppointmentController {
  // Lấy danh sách lịch hẹn (GET /api/appointments)
  async getAppointments(req, res, next) {
    try {
      const query = queryAppointmentSchema.parse(req.query);
      const result = await appointmentService.getAppointments(req.user, query);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách lịch hẹn thành công",
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

  // Lấy chi tiết lịch hẹn (GET /api/appointments/:id)
  async getAppointmentById(req, res, next) {
    try {
      const data = await appointmentService.getAppointmentById(
        req.user,
        req.params.id,
      );
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết lịch hẹn thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Đặt lịch hẹn mới (POST /api/appointments)
  async createAppointment(req, res, next) {
    try {
      const validated = createAppointmentSchema.parse(req.body);
      const data = await appointmentService.createAppointment(
        req.user,
        validated,
      );
      return res.status(201).json({
        success: true,
        message: "Đặt lịch thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật trạng thái lịch hẹn (PATCH /api/appointments/:id/status)
  async updateStatus(req, res, next) {
    try {
      const { status } = updateAppointmentStatusSchema.parse(req.body);
      const data = await appointmentService.updateStatus(
        req.user,
        req.params.id,
        status,
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái lịch hẹn thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Bắt đầu khám (PATCH /api/appointments/:id/start-exam)
  async startExam(req, res, next) {
    try {
      const data = await appointmentService.startExam(
        req.user,
        req.params.id,
      );
      return res.status(200).json({
        success: true,
        message: "Đã bắt đầu khám",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AppointmentController();
