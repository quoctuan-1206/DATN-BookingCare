import prisma from "../config/prisma.js";
import { parseDateOnly, parseTimeOnly } from "../utils/datetime.js";

const workplaceInclude = {
  doctor_workplaces: {
    include: {
      clinics: {
        select: { id: true, name: true, address: true },
      },
      specialties: {
        select: { id: true, name: true },
      },
      doctor_profiles: {
        select: {
          user_id: true,
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      },
    },
  },
};

class ScheduleRepository {
  // Lấy danh sách lịch khám kèm lọc và phân trang
  async findAll(filters) {
    const {
      doctor_id,
      clinic_id,
      specialty_id,
      doctor_workplace_id,
      work_date,
      from_date,
      to_date,
      available_only,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;
    const where = {};

    if (doctor_workplace_id) {
      where.doctor_workplace_id = doctor_workplace_id;
    }

    if (work_date) {
      where.work_date = parseDateOnly(work_date);
    } else if (from_date || to_date) {
      where.work_date = {};
      if (from_date) where.work_date.gte = parseDateOnly(from_date);
      if (to_date) where.work_date.lte = parseDateOnly(to_date);
    }

    if (doctor_id || clinic_id || specialty_id) {
      where.doctor_workplaces = {
        is_active: true,
      };
      if (doctor_id) where.doctor_workplaces.doctor_id = doctor_id;
      if (clinic_id) where.doctor_workplaces.clinic_id = clinic_id;
      if (specialty_id) where.doctor_workplaces.specialty_id = specialty_id;
    }

    const [total, schedules] = await prisma.$transaction([
      prisma.schedules.count({ where }),
      prisma.schedules.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ work_date: "asc" }, { start_time: "asc" }],
        include: workplaceInclude,
      }),
    ]);

    let filtered = schedules;
    if (available_only) {
      filtered = schedules.filter(
        (s) => (s.booked_patients || 0) < (s.max_patients || 0),
      );
    }

    return {
      total: available_only ? filtered.length : total,
      schedules: available_only ? filtered : schedules,
      page,
      limit,
    };
  }

  // Lấy chi tiết 1 lịch khám theo ID
  async findById(id) {
    return prisma.schedules.findFirst({
      where: { id: Number(id) },
      include: {
        ...workplaceInclude,
        _count: { select: { appointments: true } },
      },
    });
  }

  // Lấy nơi làm việc bác sĩ theo ID
  async findWorkplaceById(id) {
    return prisma.doctor_workplaces.findFirst({
      where: { id: Number(id) },
      include: {
        clinics: { select: { id: true, name: true } },
        specialties: { select: { id: true, name: true } },
      },
    });
  }

  // Tạo 1 khung giờ lịch khám
  async create(data) {
    return prisma.schedules.create({
      data: {
        doctor_workplace_id: data.doctor_workplace_id,
        work_date: parseDateOnly(data.work_date),
        start_time: parseTimeOnly(data.start_time),
        end_time: parseTimeOnly(data.end_time),
        max_patients: data.max_patients ?? 10,
        booked_patients: 0,
      },
      include: workplaceInclude,
    });
  }

  // Tạo nhiều khung giờ lịch khám
  async createMany(slots) {
    const created = [];
    for (const slot of slots) {
      const item = await prisma.schedules.create({
        data: {
          doctor_workplace_id: slot.doctor_workplace_id,
          work_date: parseDateOnly(slot.work_date),
          start_time: parseTimeOnly(slot.start_time),
          end_time: parseTimeOnly(slot.end_time),
          max_patients: slot.max_patients ?? 10,
          booked_patients: 0,
        },
        include: workplaceInclude,
      });
      created.push(item);
    }
    return created;
  }

  // Cập nhật lịch khám
  async update(id, data) {
    const payload = { updated_at: new Date() };

    if (data.work_date !== undefined) {
      payload.work_date = parseDateOnly(data.work_date);
    }
    if (data.start_time !== undefined) {
      payload.start_time = parseTimeOnly(data.start_time);
    }
    if (data.end_time !== undefined) {
      payload.end_time = parseTimeOnly(data.end_time);
    }
    if (data.max_patients !== undefined) {
      payload.max_patients = data.max_patients;
    }

    return prisma.schedules.update({
      where: { id: Number(id) },
      data: payload,
      include: workplaceInclude,
    });
  }

  // Xóa lịch khám
  async delete(id) {
    return prisma.schedules.delete({
      where: { id: Number(id) },
    });
  }
}

export default new ScheduleRepository();
