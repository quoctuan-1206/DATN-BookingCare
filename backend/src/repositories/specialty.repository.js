import prisma from "../config/prisma.js";

class SpecialtyRepository {
  // Lấy danh sách chuyên khoa (lọc + phân trang)
  async findAll({ search, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const where = {
      is_active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [total, specialties] = await prisma.$transaction([
      prisma.specialties.count({ where }),
      prisma.specialties.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          doctor_workplaces: {
            where: { is_active: true },
            select: {
              doctor_id: true,
              clinic_id: true,
            },
          },
        },
      }),
    ]);

    return { total, specialties, page, limit };
  }

  // Lấy chi tiết 1 chuyên khoa theo ID
  async findById(id) {
    return prisma.specialties.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        doctor_workplaces: {
          where: { is_active: true },
          select: {
            doctor_id: true,
            clinic_id: true,
            clinics: {
              select: {
                id: true,
                name: true,
                is_active: true,
              },
            },
          },
        },
      },
    });
  }

  // Tạo chuyên khoa mới
  async create(data) {
    return prisma.specialties.create({
      data: {
        ...data,
        is_active: true,
      },
      include: {
        doctor_workplaces: {
          where: { is_active: true },
          select: {
            doctor_id: true,
            clinic_id: true,
          },
        },
      },
    });
  }

  // Cập nhật chuyên khoa
  async update(id, data) {
    return prisma.specialties.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        doctor_workplaces: {
          where: { is_active: true },
          select: {
            doctor_id: true,
            clinic_id: true,
          },
        },
      },
    });
  }

  // Soft delete chuyên khoa (is_active = false)
  async softDelete(id) {
    const specialtyId = Number(id);

    return prisma.$transaction(async (tx) => {
      const specialty = await tx.specialties.update({
        where: { id: specialtyId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // Ngưng các workplace thuộc chuyên khoa này
      await tx.doctor_workplaces.updateMany({
        where: { specialty_id: specialtyId },
        data: { is_active: false },
      });

      return specialty;
    });
  }
}

export default new SpecialtyRepository();
