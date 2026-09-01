import prescriptionService from "../services/prescription.service.js";
import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
} from "../validators/prescription.validator.js";

class PrescriptionController {
  async getById(req, res, next) {
    try {
      const data = await prescriptionService.getById(req.user, req.params.id);
      return res.status(200).json({
        success: true,
        message: "Lấy chi tiết đơn thuốc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByMedicalRecordId(req, res, next) {
    try {
      const data = await prescriptionService.getByMedicalRecordId(
        req.user,
        req.params.medicalRecordId,
      );
      return res.status(200).json({
        success: true,
        message: "Lấy đơn thuốc theo bệnh án thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validated = createPrescriptionSchema.parse(req.body);
      const data = await prescriptionService.create(req.user, validated);
      return res.status(201).json({
        success: true,
        message: "Kê đơn thuốc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validated = updatePrescriptionSchema.parse(req.body);
      const data = await prescriptionService.update(
        req.user,
        req.params.id,
        validated,
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật đơn thuốc thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PrescriptionController();
