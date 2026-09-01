import medicineRepository from "../repositories/medicine.repository.js";

class MedicineService {
  formatMedicine(medicine) {
    if (!medicine) return null;
    return {
      id: medicine.id,
      name: medicine.name,
      unit: medicine.unit || null,
      price: medicine.price != null ? Number(medicine.price) : null,
      description: medicine.description || null,
      created_at: medicine.created_at,
    };
  }

  parseId(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      const error = new Error("ID thuốc không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return n;
  }

  async getMedicines(query) {
    const { total, medicines, page, limit } = await medicineRepository.findAll(
      {},
      query,
    );

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: medicines.map((m) => this.formatMedicine(m)),
    };
  }

  async getById(id) {
    const medicine = await medicineRepository.findById(this.parseId(id));
    if (!medicine) {
      const error = new Error("Không tìm thấy thuốc");
      error.statusCode = 404;
      throw error;
    }
    return this.formatMedicine(medicine);
  }

  async create(data) {
    const medicine = await medicineRepository.create({
      name: data.name.trim(),
      unit: data.unit?.trim() || null,
      price: data.price ?? null,
      description: data.description?.trim() || null,
    });
    return this.formatMedicine(medicine);
  }

  async update(id, data) {
    const medicineId = this.parseId(id);
    const existing = await medicineRepository.findById(medicineId);
    if (!existing) {
      const error = new Error("Không tìm thấy thuốc");
      error.statusCode = 404;
      throw error;
    }

    const payload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.unit !== undefined) payload.unit = data.unit?.trim() || null;
    if (data.price !== undefined) payload.price = data.price;
    if (data.description !== undefined) {
      payload.description = data.description?.trim() || null;
    }

    const medicine = await medicineRepository.update(medicineId, payload);
    return this.formatMedicine(medicine);
  }

  async delete(id) {
    const medicineId = this.parseId(id);
    const existing = await medicineRepository.findById(medicineId);
    if (!existing) {
      const error = new Error("Không tìm thấy thuốc");
      error.statusCode = 404;
      throw error;
    }

    const usageCount = await medicineRepository.countPrescriptionUsage(medicineId);
    if (usageCount > 0) {
      const error = new Error(
        "Thuốc đã được dùng trong đơn thuốc, không thể xóa",
      );
      error.statusCode = 400;
      throw error;
    }

    await medicineRepository.delete(medicineId);
    return { id: medicineId };
  }
}

export default new MedicineService();
