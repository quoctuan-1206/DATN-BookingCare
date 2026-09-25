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
          blood_pressure: data.blood_pressure || null,
          heart_rate: data.heart_rate ?? null,
          temperature: data.temperature ?? null,
          spo2: data.spo2 ?? null,
          respiratory_rate: data.respiratory_rate ?? null,
          weight: data.weight ?? null,
          height: data.height ?? null,
          clinical_examination: data.clinical_examination || null,
          diagnosis: data.diagnosis,
          icd10_code: data.icd10_code || null,
          secondary_diagnosis: data.secondary_diagnosis || null,
          assessment: data.assessment || null,
          follow_up_date: data.follow_up_date
            ? new Date(`${data.follow_up_date}T00:00:00.000Z`)
            : null,
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
    if (data.blood_pressure !== undefined) payload.blood_pressure = data.blood_pressure;
    if (data.heart_rate !== undefined) payload.heart_rate = data.heart_rate;
    if (data.temperature !== undefined) payload.temperature = data.temperature;
    if (data.spo2 !== undefined) payload.spo2 = data.spo2;
    if (data.respiratory_rate !== undefined) payload.respiratory_rate = data.respiratory_rate;
    if (data.weight !== undefined) payload.weight = data.weight;
    if (data.height !== undefined) payload.height = data.height;
    if (data.clinical_examination !== undefined) payload.clinical_examination = data.clinical_examination;
    if (data.diagnosis !== undefined) payload.diagnosis = data.diagnosis;
    if (data.icd10_code !== undefined) payload.icd10_code = data.icd10_code;
    if (data.secondary_diagnosis !== undefined) payload.secondary_diagnosis = data.secondary_diagnosis;
    if (data.assessment !== undefined) payload.assessment = data.assessment;
    if (data.follow_up_date !== undefined) {
      payload.follow_up_date = data.follow_up_date
        ? new Date(`${data.follow_up_date}T00:00:00.000Z`)
        : null;
    }
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
