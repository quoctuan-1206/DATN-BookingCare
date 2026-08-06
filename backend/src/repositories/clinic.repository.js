import prisma from "../config/prisma.js";

class ClinicRepository {
  // Lấy danh sách phòng khám (lọc + phân trang)
  async findAll({ search, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const where = {
      is_active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, clinics] = await prisma.$transaction([
      prisma.clinics.count({ where }),
      prisma.clinics.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          _count: {
            select: {
              doctor_workplaces: {
                where: { is_active: true },
              },
            },
          },
        },
      }),
    ]);

    return { total, clinics, page, limit };
  }

  // Lấy chi tiết 1 phòng khám theo ID
  async findById(id) {
    return prisma.clinics.findFirst({
      where: {
        id: Number(id),
      },
      include: {
        _count: {
          select: {
            doctor_workplaces: {
              where: { is_active: true },
            },
          },
        },
      },
    });
  }

  // Tạo phòng khám mới
  async create(data) {
    return prisma.clinics.create({
      data: {
        ...data,
        is_active: true,
      },
      include: {
        _count: {
          select: {
            doctor_workplaces: {
              where: { is_active: true },
            },
          },
        },
      },
    });
  }

  // Cập nhật phòng khám
  async update(id, data) {
    return prisma.clinics.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: {
            doctor_workplaces: {
              where: { is_active: true },
            },
          },
        },
      },
    });
  }

  // Soft delete phòng khám (is_active = false)
  async softDelete(id) {
    const clinicId = Number(id);

    return prisma.$transaction(async (tx) => {
      const clinic = await tx.clinics.update({
        where: { id: clinicId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // Ngưng các nơi làm việc thuộc phòng khám này
      await tx.doctor_workplaces.updateMany({
        where: { clinic_id: clinicId },
        data: { is_active: false },
      });

      return clinic;
    });
  }
}

export default new ClinicRepository();
