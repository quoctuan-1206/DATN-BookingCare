import clinicRepository from "../repositories/clinic.repository.js";

class ClinicService {
  // Chuẩn hóa dữ liệu phòng khám trả về API
  formatClinicResponse(clinic) {
    if (!clinic) return null;

    const doctorCount = clinic._count?.doctor_workplaces ?? 0;
    const image =
      clinic.image || `https://picsum.photos/600/400?clinic=${clinic.id}`;

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      address_full: clinic.address,
      phone: clinic.phone || null,
      email: clinic.email || null,
      description: clinic.description || null,
      specialties_content: clinic.specialties_content || null,
      equipment_content: clinic.equipment_content || null,
      image,
      is_active: clinic.is_active,
      doctor_count: doctorCount,
      mapQuery: encodeURIComponent(clinic.name || clinic.address || ""),
      created_at: clinic.created_at,
      updated_at: clinic.updated_at,
    };
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const clinicId = Number(id);
    if (!Number.isInteger(clinicId) || clinicId <= 0) {
      const error = new Error("ID phòng khám không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return clinicId;
  }

  // Lấy danh sách phòng khám
  async getAllClinics(queryParams) {
    const { total, clinics, page, limit } =
      await clinicRepository.findAll(queryParams);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: clinics.map((c) => this.formatClinicResponse(c)),
    };
  }

  // Lấy chi tiết phòng khám
  async getClinicById(id) {
    const clinicId = this.parseId(id);
    const clinic = await clinicRepository.findById(clinicId);

    if (!clinic || clinic.is_active === false) {
      const error = new Error("Không tìm thấy phòng khám");
      error.statusCode = 404;
      throw error;
    }

    return this.formatClinicResponse(clinic);
  }

  // Tạo phòng khám mới
  async createClinic(data) {
    const payload = {
      name: data.name,
      address: data.address,
      phone: data.phone || null,
      email: data.email || null,
      description: data.description || null,
      specialties_content: data.specialties_content || null,
      equipment_content: data.equipment_content || null,
      image: data.image || null,
    };

    // Bỏ email rỗng
    if (payload.email === "") payload.email = null;

    const clinic = await clinicRepository.create(payload);
    return this.formatClinicResponse(clinic);
  }

  // Cập nhật phòng khám
  async updateClinic(id, data) {
    const clinicId = this.parseId(id);
    const existing = await clinicRepository.findById(clinicId);

    if (!existing) {
      const error = new Error("Không tìm thấy phòng khám");
      error.statusCode = 404;
      throw error;
    }

    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.address !== undefined) payload.address = data.address;
    if (data.phone !== undefined) payload.phone = data.phone || null;
    if (data.email !== undefined) payload.email = data.email || null;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.specialties_content !== undefined) {
      payload.specialties_content = data.specialties_content || null;
    }
    if (data.equipment_content !== undefined) {
      payload.equipment_content = data.equipment_content || null;
    }
    if (data.image !== undefined) payload.image = data.image || null;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    if (payload.email === "") payload.email = null;

    const clinic = await clinicRepository.update(clinicId, payload);
    return this.formatClinicResponse(clinic);
  }

  // Soft delete phòng khám
  async deleteClinic(id) {
    const clinicId = this.parseId(id);
    const existing = await clinicRepository.findById(clinicId);

    if (!existing) {
      const error = new Error("Không tìm thấy phòng khám");
      error.statusCode = 404;
      throw error;
    }

    if (existing.is_active === false) {
      const error = new Error("Phòng khám đã bị vô hiệu hóa");
      error.statusCode = 400;
      throw error;
    }

    await clinicRepository.softDelete(clinicId);

    return {
      message: `Đã vô hiệu hóa phòng khám ID ${clinicId} thành công`,
    };
  }
}

export default new ClinicService();
