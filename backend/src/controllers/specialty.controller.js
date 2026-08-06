import specialtyService from "../services/specialty.service.js";
import {
  createSpecialtySchema,
  updateSpecialtySchema,
  querySpecialtySchema,
} from "../validators/specialty.validator.js";

class SpecialtyController {
  // Lấy danh sách chuyên khoa (GET /api/specialties)
  async getAllSpecialties(req, res, next) {
    try {
      const validatedQuery = querySpecialtySchema.parse(req.query);
      const result = await specialtyService.getAllSpecialties(validatedQuery);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách chuyên khoa thành công",
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

  // Lấy chi tiết chuyên khoa (GET /api/specialties/:id)
  async getSpecialtyById(req, res, next) {
    try {
      const { id } = req.params;
      const specialty = await specialtyService.getSpecialtyById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin chi tiết chuyên khoa thành công",
        data: specialty,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo chuyên khoa (POST /api/specialties)
  async createSpecialty(req, res, next) {
    try {
      const validatedData = createSpecialtySchema.parse(req.body);
      const newSpecialty =
        await specialtyService.createSpecialty(validatedData);

      return res.status(201).json({
        success: true,
        message: "Tạo chuyên khoa thành công",
        data: newSpecialty,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật chuyên khoa (PUT /api/specialties/:id)
  async updateSpecialty(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = updateSpecialtySchema.parse(req.body);
      const updatedSpecialty = await specialtyService.updateSpecialty(
        id,
        validatedData,
      );

      return res.status(200).json({
        success: true,
        message: "Cập nhật chuyên khoa thành công",
        data: updatedSpecialty,
      });
    } catch (error) {
      next(error);
    }
  }

  // Soft delete chuyên khoa (DELETE /api/specialties/:id)
  async deleteSpecialty(req, res, next) {
    try {
      const { id } = req.params;
      const result = await specialtyService.deleteSpecialty(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SpecialtyController();
