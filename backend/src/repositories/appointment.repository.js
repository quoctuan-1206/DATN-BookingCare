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
  invoices: {
    select: {
      id: true,
      invoice_type: true,
      amount: true,
      payment_method: true,
      payment_status: true,
      payment_expires_at: true,
      vnp_txn_ref: true,
      transaction_id: true,
      payment_date: true,
    },
  },
};

class AppointmentRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  // Lấy danh sách lịch hẹn kèm lọc và phân trang
  async findAll(where, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [total, appointments] = await this.prisma.$transaction([
      this.prisma.appointments.count({ where }),
      this.prisma.appointments.findMany({
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
    return this.prisma.appointments.findFirst({
      where: { id: Number(id) },
      include: appointmentInclude,
    });
  }

  // Tìm lịch hẹn đang hiệu lực theo khung giờ và hồ sơ bệnh nhân
  async findActiveByScheduleAndProfile(scheduleId, profileId) {
    return this.prisma.appointments.findFirst({
      where: {
        schedule_id: Number(scheduleId),
        patient_profile_id: Number(profileId),
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  }

  // Tạo lịch hẹn mới và tăng số chỗ đã đặt trên khung giờ
  async createWithBooking(data, now = new Date()) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.schedules.findFirst({
        where: { id: Number(data.schedule_id) },
        include: {
          doctor_workplaces: {
            include: {
              doctor_profiles: true,
            },
          },
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

      const amount =
        schedule.doctor_workplaces?.consultation_fee ??
        schedule.doctor_workplaces?.doctor_profiles?.consultation_fee ??
        0;

      await tx.invoices.create({
        data: {
          appointment_id: appointment.id,
          invoice_type: "CLINIC_FEE",
          amount,
          payment_method: "VNPAY",
          payment_status: "UNPAID",
          payment_expires_at: new Date(now.getTime() + 10 * 60 * 1000),
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
    return this.prisma.$transaction(async (tx) => {
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
    return this.prisma.appointments.update({
      where: { id: Number(id) },
      data: {
        exam_started_at: examStartedAt,
        updated_at: new Date(),
      },
      include: appointmentInclude,
    });
  }
}

export { AppointmentRepository };
export default new AppointmentRepository();
