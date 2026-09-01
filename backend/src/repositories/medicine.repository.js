import prisma from "../config/prisma.js";

class MedicineRepository {
  async findAll(where, { page = 1, limit = 100, search } = {}) {
    const skip = (page - 1) * limit;
    const conditions = { ...where };

    if (search) {
      conditions.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [total, medicines] = await prisma.$transaction([
      prisma.medicines.count({ where: conditions }),
      prisma.medicines.findMany({
        where: conditions,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return { total, medicines, page, limit };
  }

  async findById(id) {
    return prisma.medicines.findFirst({
      where: { id: Number(id) },
    });
  }

  async create(data) {
    return prisma.medicines.create({ data });
  }

  async update(id, data) {
    return prisma.medicines.update({
      where: { id: Number(id) },
      data,
    });
  }

  async countPrescriptionUsage(id) {
    return prisma.prescription_details.count({
      where: { medicine_id: Number(id) },
    });
  }

  async delete(id) {
    return prisma.medicines.delete({
      where: { id: Number(id) },
    });
  }
}

export default new MedicineRepository();
