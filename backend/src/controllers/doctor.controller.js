import doctorService from "../services/doctor.service.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
  queryDoctorSchema,
} from "../validators/doctor.validator.js";

class DoctorController {
  // Lấy danh sách bác sĩ (GET /api/doctors)
  async getAllDoctors(req, res, next) {
    try {
      const validatedQuery = queryDoctorSchema.parse(req.query);
      const result = await doctorService.getAllDoctors(validatedQuery);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách bác sĩ thành công",
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

  // Lấy chi tiết 1 bác sĩ (GET /api/doctors/:id)
  async getDoctorById(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = await doctorService.getDoctorById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin chi tiết bác sĩ thành công",
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo mới bác sĩ (POST /api/doctors)
  async createDoctor(req, res, next) {
    try {
      const validatedData = createDoctorSchema.parse(req.body);
      const newDoctor = await doctorService.createDoctor(validatedData);

      return res.status(201).json({
        success: true,
        message: "Tạo bác sĩ thành công",
        data: newDoctor,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật thông tin bác sĩ (PUT /api/doctors/:id)
  async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateDoctorSchema.parse(req.body);
      const updatedDoctor = await doctorService.updateDoctor(id, validatedData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin bác sĩ thành công",
        data: updatedDoctor,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa mềm bác sĩ (DELETE /api/doctors/:id)
  async deleteDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const result = await doctorService.deleteDoctor(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorController();
