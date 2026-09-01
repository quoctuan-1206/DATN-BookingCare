import medicineService from "../services/medicine.service.js";
import {
  queryMedicineSchema,
  createMedicineSchema,
  updateMedicineSchema,
} from "../validators/medicine.validator.js";

class MedicineController {
  async getMedicines(req, res, next) {
    try {
      const query = queryMedicineSchema.parse(req.query);
      const result = await medicineService.getMedicines(query);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách thuốc thành công",
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

  async getById(req, res, next) {
    try {
      const data = await medicineService.getById(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết thuốc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validated = createMedicineSchema.parse(req.body);
      const data = await medicineService.create(validated);
      return res.status(201).json({
        success: true,
        message: "Thêm thuốc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validated = updateMedicineSchema.parse(req.body);
      const data = await medicineService.update(req.params.id, validated);
      return res.status(200).json({
        success: true,
        message: "Cập nhật thuốc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await medicineService.delete(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Xóa thuốc thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MedicineController();
