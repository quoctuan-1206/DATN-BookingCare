import specialtyRepository from "../repositories/specialty.repository.js";

class SpecialtyService {
  // Chuẩn hóa dữ liệu chuyên khoa trả về API
  formatSpecialtyResponse(specialty, { includeClinics = false } = {}) {
    if (!specialty) return null;

    const workplaces = specialty.doctor_workplaces || [];
    const doctorIds = new Set(workplaces.map((w) => w.doctor_id));
    const clinicIds = new Set(workplaces.map((w) => w.clinic_id));
    const image =
      specialty.image ||
      `https://picsum.photos/600/400?specialty=${specialty.id}`;

    const result = {
      id: specialty.id,
      name: specialty.name,
      description: specialty.description || null,
      image,
      is_active: specialty.is_active,
      doctor_count: doctorIds.size,
      clinic_count: clinicIds.size,
      created_at: specialty.created_at,
      updated_at: specialty.updated_at,
    };

    if (includeClinics) {
      const clinicsMap = new Map();
      workplaces.forEach((w) => {
        if (w.clinics?.id && w.clinics.is_active !== false) {
          clinicsMap.set(w.clinics.id, {
            id: w.clinics.id,
            name: w.clinics.name,
          });
        }
      });
      result.clinics = Array.from(clinicsMap.values());
    }

    return result;
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const specialtyId = Number(id);
    if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
      const error = new Error("ID chuyên khoa không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return specialtyId;
  }

  // Lấy danh sách chuyên khoa
  async getAllSpecialties(queryParams) {
    const { total, specialties, page, limit } =
      await specialtyRepository.findAll(queryParams);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: specialties.map((s) => this.formatSpecialtyResponse(s)),
    };
  }

  // Lấy chi tiết chuyên khoa
  async getSpecialtyById(id) {
    const specialtyId = this.parseId(id);
    const specialty = await specialtyRepository.findById(specialtyId);

    if (!specialty || specialty.is_active === false) {
      const error = new Error("Không tìm thấy chuyên khoa");
      error.statusCode = 404;
      throw error;
    }

    return this.formatSpecialtyResponse(specialty, { includeClinics: true });
  }

  // Tạo chuyên khoa mới
  async createSpecialty(data) {
    const payload = {
      name: data.name,
      description: data.description || null,
      image: data.image || null,
    };

    const specialty = await specialtyRepository.create(payload);
    return this.formatSpecialtyResponse(specialty);
  }

  // Cập nhật chuyên khoa
  async updateSpecialty(id, data) {
    const specialtyId = this.parseId(id);
    const existing = await specialtyRepository.findById(specialtyId);

    if (!existing) {
      const error = new Error("Không tìm thấy chuyên khoa");
      error.statusCode = 404;
      throw error;
    }

    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.image !== undefined) payload.image = data.image;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    const specialty = await specialtyRepository.update(specialtyId, payload);
    return this.formatSpecialtyResponse(specialty);
  }

  // Soft delete chuyên khoa
  async deleteSpecialty(id) {
    const specialtyId = this.parseId(id);
    const existing = await specialtyRepository.findById(specialtyId);

    if (!existing) {
      const error = new Error("Không tìm thấy chuyên khoa");
      error.statusCode = 404;
      throw error;
    }

    if (existing.is_active === false) {
      const error = new Error("Chuyên khoa đã bị vô hiệu hóa");
      error.statusCode = 400;
      throw error;
    }

    await specialtyRepository.softDelete(specialtyId);

    return {
      message: `Đã vô hiệu hóa chuyên khoa ID ${specialtyId} thành công`,
    };
  }
}

export default new SpecialtyService();
