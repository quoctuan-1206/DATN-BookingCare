import clinicService from "../services/clinic.service.js";
import {
  createClinicSchema,
  updateClinicSchema,
  queryClinicSchema,
} from "../validators/clinic.validator.js";

class ClinicController {
  // Lấy danh sách phòng khám (GET /api/clinics)
  async getAllClinics(req, res, next) {
    try {
      const validatedQuery = queryClinicSchema.parse(req.query);
      const result = await clinicService.getAllClinics(validatedQuery);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách phòng khám thành công",
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

  // Lấy chi tiết phòng khám (GET /api/clinics/:id)
  async getClinicById(req, res, next) {
    try {
      const { id } = req.params;
      const clinic = await clinicService.getClinicById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin chi tiết phòng khám thành công",
        data: clinic,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo phòng khám (POST /api/clinics)
  async createClinic(req, res, next) {
    try {
      const validatedData = createClinicSchema.parse(req.body);
      const newClinic = await clinicService.createClinic(validatedData);

      return res.status(201).json({
        success: true,
        message: "Tạo phòng khám thành công",
        data: newClinic,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật phòng khám (PUT /api/clinics/:id)
  async updateClinic(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateClinicSchema.parse(req.body);
      const updatedClinic = await clinicService.updateClinic(id, validatedData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật phòng khám thành công",
        data: updatedClinic,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa mềm phòng khám (DELETE /api/clinics/:id)
  async deleteClinic(req, res, next) {
    try {
      const { id } = req.params;
      const result = await clinicService.deleteClinic(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClinicController();
