import doctorService from "../services/doctor.service.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
  queryDoctorSchema,
  workplaceSchema,
  updateWorkplaceSchema,
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

  // Lấy chi tiết bác sĩ (GET /api/doctors/:id)
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

  // Tạo bác sĩ (POST /api/doctors)
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

  // Cập nhật hồ sơ bác sĩ (PUT /api/doctors/:id)
  async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateDoctorSchema.parse(req.body);

      if (
        req.user.role?.name === "Doctor" &&
        Number(id) !== Number(req.user.id)
      ) {
        return res.status(403).json({
          success: false,
          message: "Bạn chỉ có thể cập nhật hồ sơ của chính mình",
        });
      }

      if (req.user.role?.name === "Doctor") {
        delete validatedData.is_active;
        delete validatedData.clinic_id;
        delete validatedData.specialty_id;
      }

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

  // Thêm nơi làm việc / phòng khám cho bác sĩ (POST /api/doctors/:id/workplaces)
  async addWorkplace(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = workplaceSchema.parse(req.body);
      const doctor = await doctorService.addWorkplace(
        id,
        validatedData,
        req.user,
      );

      return res.status(201).json({
        success: true,
        message: "Đã thêm phòng khám cho bác sĩ",
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật nơi làm việc của bác sĩ (PUT /api/doctors/:id/workplaces/:workplaceId)
  async updateWorkplace(req, res, next) {
    try {
      const { id, workplaceId } = req.params;
      const validatedData = updateWorkplaceSchema.parse(req.body);
      const doctor = await doctorService.updateWorkplace(
        id,
        workplaceId,
        validatedData,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Đã cập nhật nơi làm việc",
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  // Ngưng đăng ký phòng khám của bác sĩ (DELETE /api/doctors/:id/workplaces/:workplaceId)
  async removeWorkplace(req, res, next) {
    try {
      const { id, workplaceId } = req.params;
      const doctor = await doctorService.removeWorkplace(
        id,
        workplaceId,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Đã ngưng đăng ký phòng khám",
        data: doctor,
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
