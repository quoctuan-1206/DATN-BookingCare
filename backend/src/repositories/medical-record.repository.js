import prisma from "../config/prisma.js";

const recordInclude = {
  appointments: {
    include: {
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
                  users: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      lab_orders: {
        orderBy: [{ ordered_at: "desc" }, { id: "desc" }],
        include: {
          performed_by_user: {
            select: { id: true, first_name: true, last_name: true },
          },
          lab_results: {
            orderBy: { id: "asc" },
            include: { lab_tests: true },
          },
          clinical_attachments: {
            orderBy: { created_at: "asc" },
            select: {
              id: true,
              kind: true,
              original_name: true,
              mime_type: true,
              file_size: true,
              created_at: true,
            },
          },
        },
      },
    },
  },
  prescriptions: {
    include: {
      prescription_details: {
        include: {
          medicines: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  },
};

class MedicalRecordRepository {
  // Lấy danh sách bệnh án kèm lọc và phân trang
  async findAll(where, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [total, records] = await prisma.$transaction([
      prisma.medical_records.count({ where }),
      prisma.medical_records.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: recordInclude,
      }),
    ]);

    return { total, records, page, limit };
  }

  // Lấy chi tiết 1 bệnh án theo ID
  async findById(id) {
    return prisma.medical_records.findFirst({
      where: { id: Number(id) },
      include: recordInclude,
    });
  }

  // Lấy bệnh án theo ID lịch hẹn
  async findByAppointmentId(appointmentId) {
    return prisma.medical_records.findFirst({
      where: { appointment_id: Number(appointmentId) },
      include: recordInclude,
    });
  }

  // Tạo bệnh án mới; chỉ hoàn thành lịch khi không còn chỉ định cận lâm sàng đang xử lý.
  async create(data) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.medical_records.create({
        data: {
          appointment_id: Number(data.appointment_id),
          symptoms: data.symptoms || null,
          diagnosis: data.diagnosis,
          conclusion: data.conclusion || null,
          note: data.note || null,
        },
      });

      const incompleteClinicalOrderCount = await tx.lab_orders.count({
        where: {
          appointment_id: Number(data.appointment_id),
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      });

      if (incompleteClinicalOrderCount === 0) {
        await tx.appointments.update({
          where: { id: Number(data.appointment_id) },
          data: {
            status: "COMPLETED",
            updated_at: new Date(),
          },
        });
      }

      return tx.medical_records.findFirst({
        where: { id: record.id },
        include: recordInclude,
      });
    });
  }

  // Cập nhật bệnh án
  async update(id, data) {
    const payload = {};
    if (data.symptoms !== undefined) payload.symptoms = data.symptoms;
    if (data.diagnosis !== undefined) payload.diagnosis = data.diagnosis;
    if (data.conclusion !== undefined) payload.conclusion = data.conclusion;
    if (data.note !== undefined) payload.note = data.note;

    await prisma.medical_records.update({
      where: { id: Number(id) },
      data: payload,
    });

    return this.findById(id);
  }
}

export default new MedicalRecordRepository();
