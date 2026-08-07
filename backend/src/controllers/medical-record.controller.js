import medicalRecordService from "../services/medical-record.service.js";
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  queryMedicalRecordSchema,
} from "../validators/medical-record.validator.js";

class MedicalRecordController {
  // Lấy danh sách bệnh án (GET /api/medical-records)
  async getRecords(req, res, next) {
    try {
      const query = queryMedicalRecordSchema.parse(req.query);
      const result = await medicalRecordService.getRecords(req.user, query);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách bệnh án thành công",
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

  // Lấy chi tiết bệnh án (GET /api/medical-records/:id)
  async getById(req, res, next) {
    try {
      const data = await medicalRecordService.getById(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết bệnh án thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy bệnh án theo lịch hẹn (GET /api/medical-records/by-appointment/:appointmentId)
  async getByAppointmentId(req, res, next) {
    try {
      const data = await medicalRecordService.getByAppointmentId(
        req.user,
        req.params.appointmentId,
      );
      return res.status(200).json({
        success: true,
        message: "Lấy bệnh án theo lịch hẹn thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo bệnh án (POST /api/medical-records)
  async create(req, res, next) {
    try {
      const validated = createMedicalRecordSchema.parse(req.body);
      const data = await medicalRecordService.create(req.user, validated);
      return res.status(201).json({
        success: true,
        message: "Tạo bệnh án thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật bệnh án (PUT /api/medical-records/:id)
  async update(req, res, next) {
    try {
      const validated = updateMedicalRecordSchema.parse(req.body);
      const data = await medicalRecordService.update(
        req.user,
        req.params.id,
        validated,
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật bệnh án thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MedicalRecordController();
