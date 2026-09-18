import medicalRecordRepository from "../repositories/medical-record.repository.js";
import appointmentRepository from "../repositories/appointment.repository.js";
import notificationService from "./notification.service.js";
import { CLINICAL_SERVICE_LABELS } from "./lab.service.js";
import {
  formatDateOnly,
  formatTimeOnly,
  formatDateDisplay,
} from "../utils/datetime.js";

const genderLabel = {
  Male: "Nam",
  Female: "Nữ",
  Other: "Khác",
};

const relationshipLabel = {
  Self: "Bản thân",
  Spouse: "Vợ/Chồng",
  Child: "Con",
  Parent: "Cha/Mẹ",
  Sibling: "Anh/Chị/Em",
  Other: "Khác",
};

class MedicalRecordService {
  formatPatient(patient) {
    if (!patient) return {};
    const relationship = patient.relationship || "Self";
    return {
      patient_name: patient.full_name || null,
      patient_profile_id: patient.id || null,
      account_id: patient.account_id || null,
      patient_phone: patient.phone || null,
      patient_gender: patient.gender || null,
      patient_gender_label:
        genderLabel[patient.gender] || patient.gender || null,
      patient_date_of_birth: formatDateOnly(patient.date_of_birth),
      patient_relationship: relationship,
      patient_relationship_label:
        relationshipLabel[relationship] || relationship,
      patient_blood_type: patient.blood_type || null,
      patient_height:
        patient.height != null ? Number(patient.height) : null,
      patient_weight:
        patient.weight != null ? Number(patient.weight) : null,
      patient_insurance_number: patient.insurance_number || null,
      patient_emergency_contact: patient.emergency_contact || null,
    };
  }

  formatPrescriptionSummary(prescription, workDate = null) {
    if (!prescription?.id) return null;

    const items = (prescription.prescription_details || []).map((detail) => ({
      id: detail.id,
      medicine_id: detail.medicine_id,
      medicine_name: detail.medicines?.name || null,
      unit: detail.medicines?.unit || null,
      quantity: detail.quantity,
      price_at_sale: Number(detail.price_at_sale || 0),
      line_total: Number(detail.price_at_sale || 0) * detail.quantity,
      dosage: detail.dosage || null,
      instruction: detail.instruction || null,
    }));

    const followUpDays =
      prescription.follow_up_days != null
        ? Number(prescription.follow_up_days)
        : null;
    let followUpDate = null;
    if (workDate && followUpDays != null) {
      const d = new Date(`${workDate}T00:00:00.000Z`);
      if (!Number.isNaN(d.getTime())) {
        d.setUTCDate(d.getUTCDate() + followUpDays);
        followUpDate = d.toISOString().slice(0, 10);
      }
    }

    return {
      id: prescription.id,
      note: prescription.note || null,
      follow_up_days: followUpDays,
      follow_up_date: followUpDate,
      follow_up_date_display: formatDateDisplay(followUpDate),
      items,
      total_amount: items.reduce((sum, item) => sum + item.line_total, 0),
      created_at: prescription.created_at || null,
    };
  }

  formatClinicalServices(orders = [], hideUnreleased = false) {
    return orders.map((order) => {
      const hideOrderResults = hideUnreleased && order.status !== "COMPLETED";
      return {
        id: order.id,
        service_type: order.service_type || "LAB",
        service_type_label:
          CLINICAL_SERVICE_LABELS[order.service_type || "LAB"] ||
          order.service_type,
        status: order.status,
        indication: order.indication || null,
        ordered_at: order.ordered_at,
        performed_at: order.performed_at,
        completed_at: order.completed_at,
        performed_by: order.performed_by,
        performed_by_name:
          [
            order.performed_by_user?.last_name,
            order.performed_by_user?.first_name,
          ]
            .filter(Boolean)
            .join(" ") || null,
        results: (order.lab_results || []).map((result) => ({
          id: result.id,
          test_id: result.test_id,
          service_name:
            result.service_name_snapshot || result.lab_tests?.name || null,
          price: Number(
            result.price_snapshot ?? result.lab_tests?.price ?? 0,
          ),
          result: hideOrderResults ? null : result.result,
          unit: hideOrderResults ? null : result.unit,
          reference_range: hideOrderResults ? null : result.reference_range,
          findings: hideOrderResults ? null : result.findings,
          conclusion: hideOrderResults ? null : result.conclusion,
          measurements: hideOrderResults ? null : result.measurements,
          note: hideOrderResults ? null : result.note,
        })),
        attachments: hideOrderResults
          ? []
          : (order.clinical_attachments || []).map((attachment) => ({
              id: attachment.id,
              kind: attachment.kind,
              name: attachment.original_name,
              mime_type: attachment.mime_type,
              size: attachment.file_size,
              created_at: attachment.created_at,
              download_url: `/api/clinical/attachments/${attachment.id}/file`,
            })),
      };
    });
  }

  // Chuẩn hóa định dạng dữ liệu bệnh án trả về cho API
  formatRecord(record, viewerRole = null) {
    if (!record) return null;

    const appointment = record.appointments;
    const schedule = appointment?.schedules;
    const workplace = schedule?.doctor_workplaces;
    const doctorUser = workplace?.doctor_profiles?.users;
    const doctorName = doctorUser
      ? [doctorUser.last_name, doctorUser.first_name]
          .filter(Boolean)
          .join(" ")
          .trim()
      : null;

    const workDate = formatDateOnly(schedule?.work_date);
    const startTime = formatTimeOnly(schedule?.start_time);
    const endTime = formatTimeOnly(schedule?.end_time);
    const patient = appointment?.patient_profiles;
    const prescription = this.formatPrescriptionSummary(
      record.prescriptions,
      workDate,
    );
    const clinicalServices = this.formatClinicalServices(
      appointment?.lab_orders,
      viewerRole === "Patient",
    );

    return {
      id: record.id,
      appointment_id: record.appointment_id,
      symptoms: record.symptoms || null,
      diagnosis: record.diagnosis || null,
      conclusion: record.conclusion || null,
      note: record.note || null,
      booking_code: appointment?.booking_code || null,
      appointment_status: appointment?.status || null,
      work_date: workDate,
      date_display: formatDateDisplay(workDate),
      start_time: startTime,
      end_time: endTime,
      time: startTime && endTime ? `${startTime} - ${endTime}` : null,
      doctor_id: workplace?.doctor_id || doctorUser?.id || null,
      doctor_name: doctorName,
      doctor_avatar: doctorUser?.avatar || null,
      specialty: workplace?.specialties?.name || null,
      clinic: workplace?.clinics?.name || null,
      clinic_address: workplace?.clinics?.address || null,
      ...this.formatPatient(patient),
      has_prescription: Boolean(prescription?.id),
      prescription,
      has_clinical_services: clinicalServices.length > 0,
      clinical_services: clinicalServices,
      created_at: record.created_at,
    };
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) {
      const error = new Error("ID bệnh án không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return n;
  }

  // Xây điều kiện lọc bệnh án theo quyền người dùng
  buildWhere(user, query) {
    const role = user.role?.name;
    const where = {};

    if (query.appointment_id) {
      where.appointment_id = query.appointment_id;
    }

    if (query.search) {
      where.OR = [
        { diagnosis: { contains: query.search } },
        { symptoms: { contains: query.search } },
        { conclusion: { contains: query.search } },
        {
          appointments: {
            booking_code: { contains: query.search },
          },
        },
        {
          appointments: {
            patient_profiles: {
              full_name: { contains: query.search },
            },
          },
        },
      ];
    }

    if (role === "Admin") return where;

    if (role === "Doctor") {
      where.appointments = {
        ...(where.appointments || {}),
        schedules: {
          doctor_workplaces: { doctor_id: user.id },
        },
      };
      return where;
    }

    // Patient
    where.appointments = {
      ...(where.appointments || {}),
      patient_profiles: { account_id: user.id },
    };
    return where;
  }

  // Kiểm tra quyền xem bệnh án
  assertCanView(user, record) {
    const role = user.role?.name;
    if (role === "Admin") return;

    const doctorId =
      record.appointments?.schedules?.doctor_workplaces?.doctor_id ||
      record.appointments?.schedules?.doctor_workplaces?.doctor_profiles?.users
        ?.id;
    const accountId = record.appointments?.patient_profiles?.account_id;

    if (role === "Doctor" && Number(doctorId) === Number(user.id)) return;
    if (role === "Patient" && Number(accountId) === Number(user.id)) return;

    const error = new Error("Bạn không có quyền xem bệnh án này");
    error.statusCode = 403;
    throw error;
  }

  // Lấy danh sách bệnh án theo quyền người dùng
  async getRecords(user, query) {
    const where = this.buildWhere(user, query);
    const { total, records, page, limit } =
      await medicalRecordRepository.findAll(where, query);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: records.map((r) => this.formatRecord(r, user.role?.name)),
    };
  }

  // Lấy chi tiết bệnh án theo ID
  async getById(user, id) {
    const record = await medicalRecordRepository.findById(this.parseId(id));
    if (!record) {
      const error = new Error("Không tìm thấy bệnh án");
      error.statusCode = 404;
      throw error;
    }
    this.assertCanView(user, record);
    return this.formatRecord(record, user.role?.name);
  }

  // Lấy bệnh án theo ID lịch hẹn
  async getByAppointmentId(user, appointmentId) {
    const record = await medicalRecordRepository.findByAppointmentId(
      appointmentId,
    );
    if (!record) {
      const error = new Error("Chưa có bệnh án cho lịch hẹn này");
      error.statusCode = 404;
      throw error;
    }
    this.assertCanView(user, record);
    return this.formatRecord(record, user.role?.name);
  }

  // Tạo bệnh án mới
  async create(user, data) {
    if (user.role?.name !== "Doctor" && user.role?.name !== "Admin") {
      const error = new Error("Chỉ bác sĩ được tạo bệnh án");
      error.statusCode = 403;
      throw error;
    }

    const appointment = await appointmentRepository.findById(
      data.appointment_id,
    );
    if (!appointment) {
      const error = new Error("Không tìm thấy lịch hẹn");
      error.statusCode = 404;
      throw error;
    }

    const doctorId =
      appointment.schedules?.doctor_workplaces?.doctor_id ||
      appointment.schedules?.doctor_workplaces?.doctor_profiles?.users?.id;

    if (
      user.role?.name === "Doctor" &&
      Number(doctorId) !== Number(user.id)
    ) {
      const error = new Error("Lịch hẹn không thuộc bác sĩ này");
      error.statusCode = 403;
      throw error;
    }

    if (
      appointment.status !== "CONFIRMED" &&
      appointment.status !== "COMPLETED"
    ) {
      const error = new Error(
        "Chỉ tạo bệnh án cho lịch đã xác nhận hoặc hoàn thành",
      );
      error.statusCode = 400;
      throw error;
    }

    const existing = await medicalRecordRepository.findByAppointmentId(
      data.appointment_id,
    );
    if (existing) {
      const error = new Error("Lịch hẹn này đã có bệnh án");
      error.statusCode = 409;
      throw error;
    }

    try {
      const record = await medicalRecordRepository.create(data);

      const accountId = record.appointments?.patient_profiles?.account_id;
      if (accountId) {
        try {
          await notificationService.notify(accountId, {
            title: "Có bệnh án mới",
            content: `Bác sĩ đã tạo bệnh án cho lịch ${record.appointments?.booking_code || ""}.`,
            link: `/patient/medical-records/${record.id}`,
            type: "MEDICAL_RECORD",
          });
        } catch {
          // Không chặn tạo bệnh án nếu gửi thông báo lỗi
        }
      }

      return this.formatRecord(record, user.role?.name);
    } catch (error) {
      if (error.code === "P2002") {
        const err = new Error("Lịch hẹn này đã có bệnh án");
        err.statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  // Cập nhật bệnh án
  async update(user, id, data) {
    const recordId = this.parseId(id);
    const existing = await medicalRecordRepository.findById(recordId);

    if (!existing) {
      const error = new Error("Không tìm thấy bệnh án");
      error.statusCode = 404;
      throw error;
    }

    const doctorId =
      existing.appointments?.schedules?.doctor_workplaces?.doctor_id ||
      existing.appointments?.schedules?.doctor_workplaces?.doctor_profiles
        ?.users?.id;

    if (
      user.role?.name === "Doctor" &&
      Number(doctorId) !== Number(user.id)
    ) {
      const error = new Error("Bạn không có quyền sửa bệnh án này");
      error.statusCode = 403;
      throw error;
    }

    if (user.role?.name === "Patient") {
      const error = new Error("Bệnh nhân không được sửa bệnh án");
      error.statusCode = 403;
      throw error;
    }

    const updated = await medicalRecordRepository.update(recordId, data);
    return this.formatRecord(updated, user.role?.name);
  }
}

export default new MedicalRecordService();
