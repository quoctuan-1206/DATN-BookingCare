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
  async lockAndAssertNoOverlap(tx, schedule, excludeId) {
    await tx.$queryRaw`SELECT id FROM doctor_workplaces WHERE id = ${Number(schedule.doctor_workplace_id)} FOR UPDATE`;
    const rows = await tx.schedules.findMany({
      where: {
        doctor_workplace_id: Number(schedule.doctor_workplace_id),
        work_date: parseDateOnly(schedule.work_date),
        ...(excludeId ? { id: { not: Number(excludeId) } } : {}),
      },
      select: { start_time: true, end_time: true },
    });
    const start = parseTimeOnly(schedule.start_time).getTime();
    const end = parseTimeOnly(schedule.end_time).getTime();
    if (rows.some((row) => start < row.end_time.getTime() && end > row.start_time.getTime())) {
      const error = new Error("Khung giờ bị trùng với lịch làm việc đã tạo");
      error.statusCode = 409;
      throw error;
    }
  }

  async hasOverlap({ workplaceId, workDate, startTime, endTime, excludeId }) {
    const rows = await prisma.schedules.findMany({
      where: {
        doctor_workplace_id: Number(workplaceId),
        work_date: parseDateOnly(workDate),
        ...(excludeId ? { id: { not: Number(excludeId) } } : {}),
      },
      select: { start_time: true, end_time: true },
    });
    const start = parseTimeOnly(startTime).getTime();
    const end = parseTimeOnly(endTime).getTime();
    return rows.some((row) => start < row.end_time.getTime() && end > row.start_time.getTime());
  }

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
      consultation_type,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;
    const where = {};
    if (consultation_type) where.consultation_type = consultation_type;

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

  async findActiveAppointments(id) {
    return prisma.appointments.findMany({
      where: {
        schedule_id: Number(id),
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "CHECKED_IN",
            "WAITING",
            "CALLED",
            "IN_PROGRESS",
          ],
        },
      },
      select: {
        id: true,
        booking_code: true,
        patient_profiles: { select: { account_id: true } },
      },
    });
  }

  // Tạo 1 khung giờ lịch khám
  async create(data) {
    return prisma.$transaction(async (tx) => {
      await this.lockAndAssertNoOverlap(tx, data);
      return tx.schedules.create({
        data: {
          doctor_workplace_id: data.doctor_workplace_id,
          work_date: parseDateOnly(data.work_date),
          start_time: parseTimeOnly(data.start_time),
          end_time: parseTimeOnly(data.end_time),
          max_patients: data.max_patients ?? 10,
          consultation_type: data.consultation_type || "IN_PERSON",
          booked_patients: 0,
        },
        include: workplaceInclude,
      });
    });
  }

  // Tạo nhiều khung giờ lịch khám
  async createMany(slots) {
    return prisma.$transaction(async (tx) => {
      const created = [];
      for (const slot of slots) {
        await this.lockAndAssertNoOverlap(tx, slot);
        const item = await tx.schedules.create({
          data: {
            doctor_workplace_id: slot.doctor_workplace_id,
            work_date: parseDateOnly(slot.work_date),
            start_time: parseTimeOnly(slot.start_time),
            end_time: parseTimeOnly(slot.end_time),
            max_patients: slot.max_patients ?? 10,
            consultation_type: slot.consultation_type || "IN_PERSON",
            booked_patients: 0,
          },
          include: workplaceInclude,
        });
        created.push(item);
      }
      return created;
    });
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
    if (data.consultation_type !== undefined) {
      payload.consultation_type = data.consultation_type;
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.schedules.findUnique({ where: { id: Number(id) } });
      if (!existing) return null;
      await this.lockAndAssertNoOverlap(tx, {
        doctor_workplace_id: existing.doctor_workplace_id,
        start_time: data.start_time ?? formatTimeOnly(existing.start_time),
        end_time: data.end_time ?? formatTimeOnly(existing.end_time),
        work_date: data.work_date ?? formatDateOnly(existing.work_date),
      }, id);
      return tx.schedules.update({
        where: { id: Number(id) },
        data: payload,
        include: workplaceInclude,
      });
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
