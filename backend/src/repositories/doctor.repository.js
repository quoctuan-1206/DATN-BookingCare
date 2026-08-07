import prisma from "../config/prisma.js";

// Vai trò Bác sĩ trong bảng roles (Doctor = 2)
const DOCTOR_ROLE_ID = 2;

class DoctorRepository {
  // Lấy danh sách bác sĩ kèm lọc và phân trang
  async findAll({ search, specialty_id, clinic_id, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const where = {
      role_id: DOCTOR_ROLE_ID,
      is_active: true,
    };

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (specialty_id || clinic_id) {
      const workplaceWhere = { is_active: true };
      if (specialty_id) workplaceWhere.specialty_id = Number(specialty_id);
      if (clinic_id) workplaceWhere.clinic_id = Number(clinic_id);

      where.doctor_profiles = {
        doctor_workplaces: {
          some: workplaceWhere,
        },
      };
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
          doctor_profiles: {
            include: {
              doctor_workplaces: {
                where: { is_active: true },
                include: {
                  clinics: true,
                  specialties: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
    ]);

    return { total, users, page, limit };
  }

  // Lấy chi tiết 1 bác sĩ theo ID
  async findById(id) {
    const user = await prisma.users.findFirst({
      where: {
        id: Number(id),
        role_id: DOCTOR_ROLE_ID,
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
        doctor_profiles: {
          include: {
            doctor_workplaces: {
              where: { is_active: true },
              include: {
                clinics: true,
                specialties: true,
              },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            created_at: true,
            patient_profiles: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    return user;
  }

  // Tìm người dùng theo email
  async findByEmail(email) {
    return prisma.users.findUnique({
      where: { email },
    });
  }

  async findClinicById(id) {
    return prisma.clinics.findFirst({
      where: { id: Number(id) },
    });
  }

  async findSpecialtyById(id) {
    return prisma.specialties.findFirst({
      where: { id: Number(id) },
    });
  }

  // Tạo mới tài khoản và hồ sơ bác sĩ
  async create(userData, profileData, workplaceData) {
    return prisma.$transaction(async (tx) => {
      // 1. Tạo tài khoản người dùng (users)
      const user = await tx.users.create({
        data: {
          ...userData,
          role_id: DOCTOR_ROLE_ID,
          is_active: true,
        },
      });

      // 2. Tạo hồ sơ bác sĩ (doctor_profiles)
      const profile = await tx.doctor_profiles.create({
        data: {
          user_id: user.id,
          ...profileData,
        },
      });

      // 3. Tạo nơi làm việc (doctor_workplaces) nếu có phòng khám và chuyên khoa
      let workplace = null;
      if (workplaceData && workplaceData.clinic_id && workplaceData.specialty_id) {
        workplace = await tx.doctor_workplaces.create({
          data: {
            doctor_id: user.id,
            clinic_id: workplaceData.clinic_id,
            specialty_id: workplaceData.specialty_id,
            room: workplaceData.room || null,
            consultation_fee: profileData.consultation_fee || 0,
            is_active: true,
          },
        });
      }

      return this.findById(user.id);
    });
  }

  // Cập nhật thông tin bác sĩ
  async update(id, userData, profileData, workplaceData) {
    const doctorId = Number(id);

    return prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin tài khoản người dùng
      if (Object.keys(userData).length > 0) {
        await tx.users.update({
          where: { id: doctorId },
          data: {
            ...userData,
            updated_at: new Date(),
          },
        });
      }

      // 2. Cập nhật hoặc tạo mới hồ sơ bác sĩ
      if (Object.keys(profileData).length > 0) {
        await tx.doctor_profiles.upsert({
          where: { user_id: doctorId },
          update: {
            ...profileData,
            updated_at: new Date(),
          },
          create: {
            user_id: doctorId,
            ...profileData,
          },
        });
      }

      // 3. Cập nhật hoặc tạo mới nơi làm việc của bác sĩ
      if (workplaceData && workplaceData.clinic_id && workplaceData.specialty_id) {
        await tx.doctor_workplaces.upsert({
          where: {
            uk_doctor_workplace: {
              doctor_id: doctorId,
              clinic_id: workplaceData.clinic_id,
              specialty_id: workplaceData.specialty_id,
            },
          },
          update: {
            room: workplaceData.room,
            is_active: true,
            ...(profileData.consultation_fee !== undefined
              ? { consultation_fee: profileData.consultation_fee }
              : {}),
          },
          create: {
            doctor_id: doctorId,
            clinic_id: workplaceData.clinic_id,
            specialty_id: workplaceData.specialty_id,
            room: workplaceData.room,
            consultation_fee: profileData.consultation_fee || 0,
            is_active: true,
          },
        });
      }

      return this.findById(doctorId);
    });
  }

  async findWorkplaceById(workplaceId) {
    return prisma.doctor_workplaces.findFirst({
      where: { id: Number(workplaceId) },
      include: {
        clinics: true,
        specialties: true,
      },
    });
  }

  async findWorkplaceByUnique(doctorId, clinicId, specialtyId) {
    return prisma.doctor_workplaces.findFirst({
      where: {
        doctor_id: Number(doctorId),
        clinic_id: Number(clinicId),
        specialty_id: Number(specialtyId),
      },
    });
  }

  // Thêm / kích hoạt lại nơi làm việc
  async addWorkplace(doctorId, data) {
    const existing = await this.findWorkplaceByUnique(
      doctorId,
      data.clinic_id,
      data.specialty_id,
    );

    if (existing) {
      if (existing.is_active !== false) {
        const error = new Error(
          "Bác sĩ đã đăng ký phòng khám + chuyên khoa này",
        );
        error.statusCode = 409;
        throw error;
      }

      await prisma.doctor_workplaces.update({
        where: { id: existing.id },
        data: {
          is_active: true,
          room: data.room ?? existing.room,
          consultation_fee:
            data.consultation_fee ?? existing.consultation_fee ?? 0,
        },
      });
    } else {
      await prisma.doctor_workplaces.create({
        data: {
          doctor_id: Number(doctorId),
          clinic_id: Number(data.clinic_id),
          specialty_id: Number(data.specialty_id),
          room: data.room || null,
          consultation_fee: data.consultation_fee ?? 0,
          is_active: true,
        },
      });
    }

    return this.findById(doctorId);
  }

  // Cập nhật 1 nơi làm việc
  async updateWorkplace(doctorId, workplaceId, data) {
    const workplace = await this.findWorkplaceById(workplaceId);

    if (!workplace || workplace.doctor_id !== Number(doctorId)) {
      const error = new Error("Không tìm thấy nơi làm việc");
      error.statusCode = 404;
      throw error;
    }

    await prisma.doctor_workplaces.update({
      where: { id: Number(workplaceId) },
      data: {
        ...(data.room !== undefined ? { room: data.room } : {}),
        ...(data.consultation_fee !== undefined
          ? { consultation_fee: data.consultation_fee }
          : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });

    return this.findById(doctorId);
  }

  // Ngưng nơi làm việc (soft)
  async removeWorkplace(doctorId, workplaceId) {
    const workplace = await this.findWorkplaceById(workplaceId);

    if (!workplace || workplace.doctor_id !== Number(doctorId)) {
      const error = new Error("Không tìm thấy nơi làm việc");
      error.statusCode = 404;
      throw error;
    }

    const activeCount = await prisma.doctor_workplaces.count({
      where: {
        doctor_id: Number(doctorId),
        is_active: true,
      },
    });

    if (activeCount <= 1) {
      const error = new Error(
        "Phải giữ ít nhất 1 phòng khám đang hoạt động",
      );
      error.statusCode = 400;
      throw error;
    }

    await prisma.doctor_workplaces.update({
      where: { id: Number(workplaceId) },
      data: { is_active: false },
    });

    return this.findById(doctorId);
  }

  // Xóa mềm bác sĩ (chuyển is_active = false)
  async softDelete(id) {
    const doctorId = Number(id);

    return prisma.$transaction(async (tx) => {
      // 1. Chuyển trạng thái tài khoản người dùng thành ngưng hoạt động (is_active = false)
      const user = await tx.users.update({
        where: { id: doctorId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // 2. Chuyển trạng thái các nơi làm việc của bác sĩ thành ngưng hoạt động
      await tx.doctor_workplaces.updateMany({
        where: { doctor_id: doctorId },
        data: { is_active: false },
      });

      return user;
    });
  }
}

export default new DoctorRepository();
