import patientProfileService from "../services/patient-profile.service.js";
import {
  createPatientProfileSchema,
  updatePatientProfileSchema,
} from "../validators/patient-profile.validator.js";

class PatientProfileController {
  // Lấy danh sách hồ sơ bệnh nhân của tôi (GET /api/patient-profiles)
  async getMyProfiles(req, res, next) {
    try {
      const data = await patientProfileService.getMyProfiles(req.user);
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách hồ sơ bệnh nhân thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo hồ sơ bệnh nhân (POST /api/patient-profiles)
  async createProfile(req, res, next) {
    try {
      const validated = createPatientProfileSchema.parse(req.body);
      const data = await patientProfileService.createProfile(
        req.user,
        validated,
      );
      return res.status(201).json({
        success: true,
        message: "Tạo hồ sơ bệnh nhân thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật hồ sơ bệnh nhân (PUT /api/patient-profiles/:id)
  async updateProfile(req, res, next) {
    try {
      const validated = updatePatientProfileSchema.parse(req.body);
      const data = await patientProfileService.updateProfile(
        req.user,
        req.params.id,
        validated,
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật hồ sơ bệnh nhân thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PatientProfileController();
