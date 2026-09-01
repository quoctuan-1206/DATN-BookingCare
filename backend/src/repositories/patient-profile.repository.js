import prisma from "../config/prisma.js";
import { parseDateOnly } from "../utils/datetime.js";

class PatientProfileRepository {
  // Lấy danh sách hồ sơ bệnh nhân theo account_id
  async findByAccountId(accountId) {
    return prisma.patient_profiles.findMany({
      where: { account_id: Number(accountId) },
      orderBy: { id: "asc" },
    });
  }

  // Lấy chi tiết 1 hồ sơ bệnh nhân theo ID
  async findById(id) {
    return prisma.patient_profiles.findFirst({
      where: { id: Number(id) },
    });
  }

  // Tạo hồ sơ bệnh nhân mới
  async create(accountId, data) {
    return prisma.patient_profiles.create({
      data: {
        account_id: Number(accountId),
        full_name: data.full_name,
        phone: data.phone || null,
        gender: data.gender,
        date_of_birth: parseDateOnly(data.date_of_birth),
        relationship: data.relationship || "Self",
        blood_type: data.blood_type || null,
        height: data.height ?? null,
        weight: data.weight ?? null,
        insurance_number: data.insurance_number || null,
        emergency_contact: data.emergency_contact || null,
      },
    });
  }

  // Cập nhật hồ sơ bệnh nhân
  async update(id, data) {
    const payload = { updated_at: new Date() };
    if (data.full_name !== undefined) payload.full_name = data.full_name;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.gender !== undefined) payload.gender = data.gender;
    if (data.date_of_birth !== undefined) {
      payload.date_of_birth = parseDateOnly(data.date_of_birth);
    }
    if (data.relationship !== undefined) {
      payload.relationship = data.relationship;
    }
    if (data.blood_type !== undefined) payload.blood_type = data.blood_type;
    if (data.height !== undefined) payload.height = data.height;
    if (data.weight !== undefined) payload.weight = data.weight;
    if (data.insurance_number !== undefined) {
      payload.insurance_number = data.insurance_number;
    }
    if (data.emergency_contact !== undefined) {
      payload.emergency_contact = data.emergency_contact;
    }

    return prisma.patient_profiles.update({
      where: { id: Number(id) },
      data: payload,
    });
  }

  async delete(id) {
    return prisma.patient_profiles.delete({
      where: { id: Number(id) },
    });
  }

  async countAppointments(profileId) {
    return prisma.appointments.count({
      where: { patient_profile_id: Number(profileId) },
    });
  }
}

export default new PatientProfileRepository();
