import prescriptionRepository from "../repositories/prescription.repository.js";
import medicalRecordRepository from "../repositories/medical-record.repository.js";
import medicineRepository from "../repositories/medicine.repository.js";
import notificationService from "./notification.service.js";

class PrescriptionService {
  formatPrescription(prescription) {
    if (!prescription) return null;

    const record = prescription.medical_records;
    const appointment = record?.appointments;
    const patient = appointment?.patient_profiles;
    const schedule = appointment?.schedules;
    const workplace = schedule?.doctor_workplaces;

    const items = (prescription.prescription_details || []).map((detail) => ({
      id: detail.id,
      medicine_id: detail.medicine_id,
      medicine_name: detail.medicines?.name || null,
      unit: detail.medicines?.unit || null,
      quantity: detail.quantity,
      price_at_sale: Number(detail.price_at_sale),
      line_total: Number(detail.price_at_sale) * detail.quantity,
      dosage: detail.dosage || null,
      instruction: detail.instruction || null,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0);

    return {
      id: prescription.id,
      medical_record_id: prescription.medical_record_id,
      appointment_id: record?.appointment_id || null,
      note: prescription.note || null,
      booking_code: appointment?.booking_code || null,
      patient_name: patient?.full_name || null,
      doctor_id:
        workplace?.doctor_id ||
        workplace?.doctor_profiles?.users?.id ||
        null,
      items,
      total_amount: totalAmount,
      created_at: prescription.created_at,
    };
  }

  parseId(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      const error = new Error("ID không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return n;
  }

  assertCanManage(user, record) {
    const role = user.role?.name;
    if (role === "Admin") return;

    const doctorId =
      record?.appointments?.schedules?.doctor_workplaces?.doctor_id ||
      record?.appointments?.schedules?.doctor_workplaces?.doctor_profiles?.users
        ?.id;

    if (role === "Doctor" && Number(doctorId) === Number(user.id)) return;

    const error = new Error("Bạn không có quyền thao tác đơn thuốc này");
    error.statusCode = 403;
    throw error;
  }

  assertCanView(user, prescription) {
    const role = user.role?.name;
    if (role === "Admin") return;

    const record = prescription.medical_records;
    const doctorId =
      record?.appointments?.schedules?.doctor_workplaces?.doctor_id ||
      record?.appointments?.schedules?.doctor_workplaces?.doctor_profiles?.users
        ?.id;
    const accountId = record?.appointments?.patient_profiles?.account_id;

    if (role === "Doctor" && Number(doctorId) === Number(user.id)) return;
    if (role === "Patient" && Number(accountId) === Number(user.id)) return;

    const error = new Error("Bạn không có quyền xem đơn thuốc này");
    error.statusCode = 403;
    throw error;
  }

  async resolveItems(items) {
    const resolved = [];

    for (const item of items) {
      const medicine = await medicineRepository.findById(item.medicine_id);
      if (!medicine) {
        const error = new Error(`Không tìm thấy thuốc ID ${item.medicine_id}`);
        error.statusCode = 404;
        throw error;
      }

      const price =
        medicine.price != null ? Number(medicine.price) : 0;

      resolved.push({
        medicine_id: medicine.id,
        quantity: item.quantity,
        price_at_sale: price,
        dosage: item.dosage || null,
        instruction: item.instruction || null,
      });
    }

    return resolved;
  }

  async getById(user, id) {
    const prescription = await prescriptionRepository.findById(this.parseId(id));
    if (!prescription) {
      const error = new Error("Không tìm thấy đơn thuốc");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanView(user, prescription);
    return this.formatPrescription(prescription);
  }

  async getByMedicalRecordId(user, medicalRecordId) {
    const recordId = this.parseId(medicalRecordId);
    const prescription =
      await prescriptionRepository.findByMedicalRecordId(recordId);

    if (!prescription) {
      const error = new Error("Chưa có đơn thuốc cho bệnh án này");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanView(user, prescription);
    return this.formatPrescription(prescription);
  }

  async create(user, data) {
    if (user.role?.name !== "Doctor" && user.role?.name !== "Admin") {
      const error = new Error("Chỉ bác sĩ được kê đơn thuốc");
      error.statusCode = 403;
      throw error;
    }

    const record = await medicalRecordRepository.findById(data.medical_record_id);
    if (!record) {
      const error = new Error("Không tìm thấy bệnh án");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanManage(user, record);

    const existing = await prescriptionRepository.findByMedicalRecordId(
      data.medical_record_id,
    );
    if (existing) {
      const error = new Error("Bệnh án này đã có đơn thuốc");
      error.statusCode = 409;
      throw error;
    }

    const items = await this.resolveItems(data.items || []);
    const prescription = await prescriptionRepository.create(
      {
        medical_record_id: data.medical_record_id,
        note: data.note,
      },
      items,
    );

    const accountId = record.appointments?.patient_profiles?.account_id;
    const bookingCode = record.appointments?.booking_code || "";
    if (accountId) {
      try {
        await notificationService.notify(accountId, {
          title: "Có đơn thuốc mới",
          content: `Bác sĩ đã kê đơn thuốc cho lịch ${bookingCode}.`,
          link: `/patient/medical-records/${record.id}`,
          type: "PRESCRIPTION",
        });
      } catch {
        // Không chặn kê đơn nếu gửi thông báo lỗi
      }
    }

    return this.formatPrescription(prescription);
  }

  async update(user, id, data) {
    const prescriptionId = this.parseId(id);
    const existing = await prescriptionRepository.findById(prescriptionId);

    if (!existing) {
      const error = new Error("Không tìm thấy đơn thuốc");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanManage(user, existing.medical_records);

    const items = await this.resolveItems(data.items || []);
    const updated = await prescriptionRepository.update(
      prescriptionId,
      {
        note: data.note,
      },
      items,
    );

    return this.formatPrescription(updated);
  }
}

export default new PrescriptionService();
