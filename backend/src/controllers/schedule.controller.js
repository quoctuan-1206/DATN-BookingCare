import scheduleService from "../services/schedule.service.js";
import {
  createScheduleSchema,
  updateScheduleSchema,
  queryScheduleSchema,
} from "../validators/schedule.validator.js";

class ScheduleController {
  // Lấy danh sách lịch khám (GET /api/schedules)
  async getAllSchedules(req, res, next) {
    try {
      const validatedQuery = queryScheduleSchema.parse(req.query);
      const result = await scheduleService.getAllSchedules(validatedQuery);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách lịch khám thành công",
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

  // Lấy chi tiết lịch khám (GET /api/schedules/:id)
  async getScheduleById(req, res, next) {
    try {
      const schedule = await scheduleService.getScheduleById(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết lịch khám thành công",
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo lịch khám (POST /api/schedules)
  async createSchedule(req, res, next) {
    try {
      const validatedData = createScheduleSchema.parse(req.body);
      const result = await scheduleService.createSchedule(
        validatedData,
        req.user,
      );

      return res.status(201).json({
        success: true,
        message: "Tạo lịch khám thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật lịch khám (PUT /api/schedules/:id)
  async updateSchedule(req, res, next) {
    try {
      const validatedData = updateScheduleSchema.parse(req.body);
      const schedule = await scheduleService.updateSchedule(
        req.params.id,
        validatedData,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Cập nhật lịch khám thành công",
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa lịch khám (DELETE /api/schedules/:id)
  async deleteSchedule(req, res, next) {
    try {
      const result = await scheduleService.deleteSchedule(
        req.params.id,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ScheduleController();
