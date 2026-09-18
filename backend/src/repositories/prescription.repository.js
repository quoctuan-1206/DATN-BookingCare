import prisma from "../config/prisma.js";

const prescriptionInclude = {
  medical_records: {
    include: {
      appointments: {
        include: {
          patient_profiles: {
            select: { id: true, account_id: true, full_name: true },
          },
          schedules: {
            include: {
              doctor_workplaces: {
                include: {
                  doctor_profiles: {
                    select: {
                      user_id: true,
                      users: { select: { id: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  prescription_details: {
    include: {
      medicines: true,
    },
    orderBy: { id: "asc" },
  },
};

class PrescriptionRepository {
  async findById(id) {
    return prisma.prescriptions.findFirst({
      where: { id: Number(id) },
      include: prescriptionInclude,
    });
  }

  async findByMedicalRecordId(medicalRecordId) {
    return prisma.prescriptions.findFirst({
      where: { medical_record_id: Number(medicalRecordId) },
      include: prescriptionInclude,
    });
  }

  async create(data, items) {
    return prisma.$transaction(async (tx) => {
      const prescription = await tx.prescriptions.create({
        data: {
          medical_record_id: Number(data.medical_record_id),
          note: data.note || null,
          follow_up_days:
            data.follow_up_days != null ? Number(data.follow_up_days) : null,
        },
      });

      if (items.length > 0) {
        await tx.prescription_details.createMany({
          data: items.map((item) => ({
            prescription_id: prescription.id,
            medicine_id: item.medicine_id,
            quantity: item.quantity,
            price_at_sale: item.price_at_sale,
            dosage: item.dosage || null,
            instruction: item.instruction || null,
          })),
        });
      }

      return tx.prescriptions.findFirst({
        where: { id: prescription.id },
        include: prescriptionInclude,
      });
    });
  }

  async update(id, data, items) {
    return prisma.$transaction(async (tx) => {
      await tx.prescriptions.update({
        where: { id: Number(id) },
        data: {
          note: data.note ?? null,
          follow_up_days:
            data.follow_up_days != null ? Number(data.follow_up_days) : null,
        },
      });

      await tx.prescription_details.deleteMany({
        where: { prescription_id: Number(id) },
      });

      if (items.length > 0) {
        await tx.prescription_details.createMany({
          data: items.map((item) => ({
            prescription_id: Number(id),
            medicine_id: item.medicine_id,
            quantity: item.quantity,
            price_at_sale: item.price_at_sale,
            dosage: item.dosage || null,
            instruction: item.instruction || null,
          })),
        });
      }

      return tx.prescriptions.findFirst({
        where: { id: Number(id) },
        include: prescriptionInclude,
      });
    });
  }
}

export default new PrescriptionRepository();
