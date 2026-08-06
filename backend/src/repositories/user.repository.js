import prisma from "../config/prisma.js";

class UserRepository {
  // Lấy danh sách người dùng (lọc + phân trang) — Admin
  async findAll({ search, role, is_active, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (typeof is_active === "boolean") {
      where.is_active = is_active;
    }

    if (role) {
      where.role = { name: role };
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, users] = await prisma.$transaction([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          gender: true,
          date_of_birth: true,
          address: true,
          avatar: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      }),
    ]);

    return { total, users, page, limit };
  }

  // Lấy chi tiết 1 người dùng theo ID
  async findById(id) {
    return prisma.users.findFirst({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        gender: true,
        date_of_birth: true,
        address: true,
        avatar: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        doctor_profiles: {
          select: {
            id: true,
            position: true,
            degree: true,
            experience_years: true,
          },
        },
        patient_profiles: {
          select: {
            id: true,
            full_name: true,
            relationship: true,
          },
        },
      },
    });
  }

  // Cập nhật trạng thái hoạt động
  async updateStatus(id, isActive) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.users.update({
        where: { id: Number(id) },
        data: {
          is_active: isActive,
          updated_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          gender: true,
          date_of_birth: true,
          address: true,
          avatar: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      // Khóa tài khoản → thu hồi refresh token đang còn hiệu lực
      if (!isActive) {
        await tx.refresh_tokens.deleteMany({
          where: { user_id: Number(id) },
        });
      }

      return user;
    });
  }
}

export default new UserRepository();
