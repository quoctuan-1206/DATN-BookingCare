import prisma from "../config/prisma.js";

const appointmentInclude = {
  schedules: {
    include: {
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
              consultation_fee: true,
              users: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  },
  patient_profiles: {
    select: {
      id: true,
      account_id: true,
      full_name: true,
      phone: true,
      gender: true,
      date_of_birth: true,
      relationship: true,
      blood_type: true,
      height: true,
      weight: true,
      insurance_number: true,
      emergency_contact: true,
    },
  },
  medical_records: {
    select: { id: true },
  },
  lab_orders: {
    select: { id: true, status: true },
  },
};

class AppointmentRepository {
  // Lấy danh sách lịch hẹn kèm lọc và phân trang
  async findAll(where, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [total, appointments] = await prisma.$transaction([
      prisma.appointments.count({ where }),
      prisma.appointments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: appointmentInclude,
      }),
    ]);

    return { total, appointments, page, limit };
  }

  // Lấy chi tiết 1 lịch hẹn theo ID
  async findById(id) {
    return prisma.appointments.findFirst({
      where: { id: Number(id) },
      include: appointmentInclude,
    });
  }

  // Tìm lịch hẹn đang hiệu lực theo khung giờ và hồ sơ bệnh nhân
  async findActiveByScheduleAndProfile(scheduleId, profileId) {
    return prisma.appointments.findFirst({
      where: {
        schedule_id: Number(scheduleId),
        patient_profile_id: Number(profileId),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  }

  // Tạo lịch hẹn mới và tăng số chỗ đã đặt trên khung giờ
  async createWithBooking(data) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.schedules.findFirst({
        where: { id: Number(data.schedule_id) },
        include: {
          doctor_workplaces: true,
        },
      });

      if (!schedule) {
        const error = new Error("Không tìm thấy lịch khám");
        error.statusCode = 404;
        throw error;
      }

      const maxPatients = schedule.max_patients ?? 10;
      const booked = schedule.booked_patients ?? 0;

      if (booked >= maxPatients) {
        const error = new Error("Khung giờ đã hết chỗ");
        error.statusCode = 400;
        throw error;
      }

      // TODO: bật lại sau khi test khám bệnh xong
      // if (!data.skipAdvanceCheck) {
      //   const workDate = new Date(schedule.work_date);
      //   workDate.setUTCHours(0, 0, 0, 0);
      //
      //   const minDate = new Date();
      //   minDate.setUTCHours(0, 0, 0, 0);
      //   minDate.setUTCDate(minDate.getUTCDate() + 3);
      //
      //   if (workDate < minDate) {
      //     const error = new Error(
      //       "Phải đặt lịch trước ít nhất 3 ngày",
      //     );
      //     error.statusCode = 400;
      //     throw error;
      //   }
      // }

      const duplicate = await tx.appointments.findFirst({
        where: {
          schedule_id: Number(data.schedule_id),
          patient_profile_id: Number(data.patient_profile_id),
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      if (duplicate) {
        const error = new Error(
          "Hồ sơ này đã đặt khung giờ này rồi",
        );
        error.statusCode = 409;
        throw error;
      }

      const appointment = await tx.appointments.create({
        data: {
          schedule_id: Number(data.schedule_id),
          patient_profile_id: Number(data.patient_profile_id),
          reason: data.reason,
          status: "PENDING",
          booking_code: data.booking_code,
        },
      });

      await tx.schedules.update({
        where: { id: schedule.id },
        data: {
          booked_patients: booked + 1,
          updated_at: new Date(),
        },
      });

      return tx.appointments.findFirst({
        where: { id: appointment.id },
        include: appointmentInclude,
      });
    });
  }

  // Cập nhật trạng thái lịch hẹn (có thể hoàn chỗ khi hủy)
  async updateStatus(id, status, { shouldReleaseSlot = false } = {}) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.appointments.findFirst({
        where: { id: Number(id) },
      });

      if (!existing) {
        const error = new Error("Không tìm thấy lịch hẹn");
        error.statusCode = 404;
        throw error;
      }

      const updated = await tx.appointments.update({
        where: { id: Number(id) },
        data: {
          status,
          updated_at: new Date(),
        },
        include: appointmentInclude,
      });

      if (shouldReleaseSlot) {
        const schedule = await tx.schedules.findFirst({
          where: { id: existing.schedule_id },
        });

        if (schedule && (schedule.booked_patients || 0) > 0) {
          await tx.schedules.update({
            where: { id: schedule.id },
            data: {
              booked_patients: (schedule.booked_patients || 0) - 1,
              updated_at: new Date(),
            },
          });
        }
      }

      return updated;
    });
  }

  // Lưu thời điểm bác sĩ bắt đầu khám
  async markExamStarted(id, examStartedAt = new Date()) {
    return prisma.appointments.update({
      where: { id: Number(id) },
      data: {
        exam_started_at: examStartedAt,
        updated_at: new Date(),
      },
      include: appointmentInclude,
    });
  }
}

export default new AppointmentRepository();
