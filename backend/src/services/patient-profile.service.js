import patientProfileRepository from "../repositories/patient-profile.repository.js";
import { formatDateOnly } from "../utils/datetime.js";

const genderLabel = {
  Male: "Nam",
  Female: "Nữ",
  Other: "Khác",
};

const relationshipLabel = {
  Self: "Bản thân",
  Spouse: "Vợ/Chồng",
  Child: "Con",
  Parent: "Cha/Mẹ",
  Sibling: "Anh/Chị/Em",
  Other: "Khác",
};

class PatientProfileService {
  // Chuẩn hóa định dạng dữ liệu hồ sơ bệnh nhân trả về cho API
  formatProfile(profile) {
    if (!profile) return null;
    const dob = formatDateOnly(profile.date_of_birth);
    const relationship = profile.relationship || "Self";

    return {
      id: profile.id,
      account_id: profile.account_id,
      full_name: profile.full_name,
      fullName: profile.full_name,
      phone: profile.phone || null,
      gender: profile.gender,
      gender_label: genderLabel[profile.gender] || profile.gender,
      date_of_birth: dob,
      dateOfBirth: dob,
      relationship,
      relationship_label:
        relationshipLabel[relationship] || relationship,
      blood_type: profile.blood_type || null,
      height: profile.height != null ? Number(profile.height) : null,
      weight: profile.weight != null ? Number(profile.weight) : null,
      insurance_number: profile.insurance_number || null,
      emergency_contact: profile.emergency_contact || null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  // Lấy danh sách hồ sơ bệnh nhân của tài khoản (tự tạo nếu chưa có)
  async getMyProfiles(user) {
    let profiles = await patientProfileRepository.findByAccountId(user.id);

    if (profiles.length === 0) {
      const fullName = [user.last_name, user.first_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      const created = await patientProfileRepository.create(user.id, {
        full_name: fullName || user.email,
        phone: user.phone || null,
        gender: user.gender || "Other",
        date_of_birth: user.date_of_birth
          ? formatDateOnly(user.date_of_birth)
          : "2000-01-01",
        relationship: "Self",
      });
      profiles = [created];
    }

    return profiles.map((p) => this.formatProfile(p));
  }

  // Tạo hồ sơ bệnh nhân mới
  async createProfile(user, data) {
    const profile = await patientProfileRepository.create(user.id, data);
    return this.formatProfile(profile);
  }

  // Cập nhật hồ sơ bệnh nhân
  async updateProfile(user, id, data) {
    const existing = await patientProfileRepository.findById(id);
    if (!existing || existing.account_id !== user.id) {
      const error = new Error("Không tìm thấy hồ sơ bệnh nhân");
      error.statusCode = 404;
      throw error;
    }

    const profile = await patientProfileRepository.update(id, data);
    return this.formatProfile(profile);
  }
}

export default new PatientProfileService();
