import prisma from "../config/prisma.js";
import auditLogService from "./audit-log.service.js";

const VITALS = {
  BLOOD_PRESSURE: { unit: "mmHg", min: 40, max: 300 },
  HEART_RATE: { unit: "bpm", min: 20, max: 250 },
  WEIGHT: { unit: "kg", min: 0.2, max: 500 },
  HEIGHT: { unit: "cm", min: 20, max: 260 },
  TEMPERATURE: { unit: "°C", min: 25, max: 45 },
  BLOOD_GLUCOSE: { unit: "mmol/L", min: 0.5, max: 60 },
  SPO2: { unit: "%", min: 50, max: 100 },
};
const PROFESSIONAL_ROLES = ["Doctor", "Admin"];
const APPOINTMENT_DETAILS_INCLUDE = {
  schedules: {
    include: {
      doctor_workplaces: {
        include: { clinics: true, doctor_profiles: { include: { users: true } } },
      },
    },
  },
};

function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function parseId(value, label = "ID") {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw httpError(`${label} không hợp lệ`);
  return number;
}

export function paginate(items, page = 1, limit = 10) {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));
  const start = (currentPage - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    page: currentPage,
    limit: pageSize,
    total: items.length,
    total_pages: Math.ceil(items.length / pageSize),
  };
}

export function sortTimelineEvents(events) {
  return [...events].filter((item) => item.date).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function canAccessPatientProfile(user, profile, { doctorIds = [], clinicIds = [] } = {}) {
  const role = user?.role?.name;
  if (role === "Patient") return Number(profile?.account_id) === Number(user.id);
  if (role === "Admin") return true;
  if (role === "Doctor") return doctorIds.some((id) => Number(id) === Number(user.id));
  if (role === "STAFF") return Number(user.clinic_id) > 0 && clinicIds.some((id) => Number(id) === Number(user.clinic_id));
  return false;
}

export function validateVitalInput(input) {
  const definition = VITALS[input.type];
  if (!definition) throw httpError("Loại chỉ số sức khỏe không hợp lệ");
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < definition.min || value > definition.max) {
    throw httpError(`Giá trị ${input.type} phải trong khoảng ${definition.min}–${definition.max}`);
  }
  if (input.unit !== definition.unit) throw httpError(`Đơn vị ${input.type} phải là ${definition.unit}`);
  if (input.type === "BLOOD_PRESSURE") {
    const diastolic = Number(input.secondary_value);
    if (!Number.isFinite(diastolic) || diastolic < 20 || diastolic > 200 || value <= diastolic) {
      throw httpError("Huyết áp tâm trương phải từ 20 đến 200 mmHg và nhỏ hơn tâm thu");
    }
  }
  const measuredAt = new Date(input.measured_at);
  if (!Number.isFinite(measuredAt.getTime()) || measuredAt > new Date()) throw httpError("Thời gian đo không hợp lệ hoặc ở tương lai");
  return { type: input.type, value, secondary_value: input.secondary_value == null ? null : Number(input.secondary_value), unit: definition.unit, measured_at: measuredAt };
}

function nameOf(user) {
  return [user?.last_name, user?.first_name].filter(Boolean).join(" ").trim() || null;
}

function dateOfAppointment(appointment) {
  return appointment?.completed_at || appointment?.schedules?.work_date || appointment?.created_at;
}

export class HealthRecordService {
  constructor({ database = prisma, audit = auditLogService } = {}) {
    this.db = database;
    this.audit = audit;
  }

  async assertProfileAccess(user, patientId, { write = false, professionalWrite = false } = {}) {
    const id = parseId(patientId, "Mã hồ sơ");
    const role = user.role?.name;
    const profile = await this.db.patient_profiles.findUnique({ where: { id } });
    if (!profile) throw httpError("Không tìm thấy hồ sơ", 404);

    let doctorIds = [];
    let clinicIds = [];
    if (role === "Doctor") {
      const [appointment, labOrder] = await Promise.all([
        this.db.appointments.findFirst({ where: { patient_profile_id: id, schedules: { doctor_workplaces: { doctor_id: Number(user.id) } } }, select: { id: true } }),
        this.db.lab_orders.findFirst({ where: { patient_id: id, doctor_id: Number(user.id) }, select: { id: true } }),
      ]);
      if (appointment || labOrder) doctorIds = [user.id];
    } else if (role === "STAFF") {
      const clinicId = Number(user.clinic_id);
      if (Number.isInteger(clinicId) && clinicId > 0) {
        const [appointment, labOrder] = await Promise.all([
          this.db.appointments.findFirst({ where: { patient_profile_id: id, schedules: { doctor_workplaces: { clinic_id: clinicId } } }, select: { id: true } }),
          this.db.lab_orders.findFirst({ where: { patient_id: id, clinic_id: clinicId }, select: { id: true } }),
        ]);
        if (appointment || labOrder) clinicIds = [clinicId];
      }
    }
    const allowed = canAccessPatientProfile(user, profile, { doctorIds, clinicIds });
    if (!allowed) throw httpError("Không tìm thấy hồ sơ hoặc bạn không có quyền truy cập", 404);
    if (write && role !== "Patient" && !professionalWrite && role !== "Admin") {
      throw httpError("Bạn không có quyền cập nhật hồ sơ này", 403);
    }
    return profile;
  }

  async listStored(model, patientId, user, options = {}) {
    if (user.role?.name === "STAFF") throw httpError("Dữ liệu này chỉ dành cho bệnh nhân và nhân viên y tế có quyền điều trị", 403);
    await this.assertProfileAccess(user, patientId);
    return this.db[model].findMany({
      where: { patient_profile_id: Number(patientId), deleted_at: null },
      orderBy: options.orderBy || { created_at: "desc" },
      ...(model === "patient_vitals" ? { include: { recorder: { select: { id: true, first_name: true, last_name: true } } } } : {
        include: { confirmer: { select: { id: true, first_name: true, last_name: true } } },
      }),
    });
  }

  async summary(patientId, user) {
    const profile = await this.assertProfileAccess(user, patientId);
    const staffClinicId = user.role?.name === "STAFF" ? Number(user.clinic_id) : null;
    const appointmentScope = staffClinicId ? { schedules: { doctor_workplaces: { clinic_id: staffClinicId } } } : {};
    const [appointments, records, prescriptionCount, tests, conditions, allergies, nextAppointment] = await Promise.all([
      this.db.appointments.findMany({
        where: { patient_profile_id: profile.id, status: "COMPLETED", ...appointmentScope },
        include: {
          schedules: {
            select: {
              work_date: true,
              doctor_workplaces: {
                select: {
                  doctor_profiles: { select: { users: { select: { id: true, first_name: true, last_name: true } } } },
                  clinics: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { completed_at: "desc" },
      }),
      this.db.medical_records.findMany({ where: { appointments: { patient_profile_id: profile.id, ...appointmentScope } }, select: { diagnosis: true, secondary_diagnosis: true } }),
      this.db.prescriptions.count({ where: { medical_records: { appointments: { patient_profile_id: profile.id, ...appointmentScope } } } }),
      this.db.lab_orders.count({ where: { patient_id: profile.id, ...(staffClinicId ? { clinic_id: staffClinicId } : {}) } }),
      staffClinicId ? Promise.resolve([]) : this.db.patient_conditions.findMany({ where: { patient_profile_id: profile.id, deleted_at: null, status: "MONITORING" }, select: { id: true, name: true, status: true } }),
      staffClinicId ? Promise.resolve([]) : this.db.patient_allergies.findMany({ where: { patient_profile_id: profile.id, deleted_at: null }, select: { id: true, allergen: true, confirmation_status: true } }),
      this.db.appointments.findFirst({
        where: { patient_profile_id: profile.id, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "WAITING"] }, schedules: { work_date: { gte: new Date(new Date().toDateString()) }, ...(staffClinicId ? { doctor_workplaces: { clinic_id: staffClinicId } } : {}) } },
        include: {
          schedules: {
            select: {
              work_date: true,
              start_time: true,
              doctor_workplaces: {
                select: {
                  clinics: { select: { name: true } },
                  doctor_profiles: { select: { users: { select: { first_name: true, last_name: true } } } },
                },
              },
            },
          },
        },
        orderBy: [{ schedules: { work_date: "asc" } }],
      }),
    ]);
    const latest = appointments[0];
    const lastAppointment = latest ? {
      id: latest.id,
      date: dateOfAppointment(latest),
      doctor: nameOf(latest.schedules?.doctor_workplaces?.doctor_profiles?.users),
      clinic: latest.schedules?.doctor_workplaces?.clinics?.name || null,
    } : null;
    return {
      patient: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        gender: profile.gender,
        date_of_birth: profile.date_of_birth,
        relationship: profile.relationship || "Self",
        blood_type: profile.blood_type,
        height: profile.height == null ? null : Number(profile.height),
        weight: profile.weight == null ? null : Number(profile.weight),
      },
      completed_visits: appointments.length,
      last_visit: lastAppointment,
      prescription_count: prescriptionCount,
      test_count: tests,
      conditions,
      allergies,
      next_appointment: nextAppointment ? {
        id: nextAppointment.id,
        date: nextAppointment.schedules?.work_date,
        time: nextAppointment.schedules?.start_time,
        clinic: nextAppointment.schedules?.doctor_workplaces?.clinics?.name || null,
      } : null,
      diagnoses: records.flatMap((record) => [record.diagnosis, record.secondary_diagnosis].filter(Boolean)),
    };
  }

  async timeline(patientId, user, query = {}) {
    const profile = await this.assertProfileAccess(user, patientId);
    const staffClinicId = user.role?.name === "STAFF" ? Number(user.clinic_id) : null;
    const appointmentScope = staffClinicId ? { schedules: { doctor_workplaces: { clinic_id: staffClinicId } } } : {};
    const [appointments, records, prescriptions, orders] = await Promise.all([
      this.db.appointments.findMany({
        where: { patient_profile_id: profile.id, ...appointmentScope },
        include: {
          ...APPOINTMENT_DETAILS_INCLUDE,
          medical_records: { select: { id: true, diagnosis: true } },
        },
      }),
      this.db.medical_records.findMany({
        where: { appointments: { patient_profile_id: profile.id, ...appointmentScope } },
        include: {
          appointments: { include: APPOINTMENT_DETAILS_INCLUDE },
        },
      }),
      this.db.prescriptions.findMany({
        where: { medical_records: { appointments: { patient_profile_id: profile.id, ...appointmentScope } } },
        include: {
          medical_records: { include: { appointments: { include: APPOINTMENT_DETAILS_INCLUDE } } },
        },
      }),
      this.db.lab_orders.findMany({ where: { patient_id: profile.id, ...(staffClinicId ? { clinic_id: staffClinicId } : {}) }, include: { clinics: true, users: true, lab_results: { include: { lab_tests: true } } } }),
    ]);
    const events = [
      ...appointments.map((item) => ({ id: `appointment-${item.id}`, source_id: item.id, type: "APPOINTMENT", date: dateOfAppointment(item), doctor: nameOf(item.schedules?.doctor_workplaces?.doctor_profiles?.users), clinic: item.schedules?.doctor_workplaces?.clinics?.name || null, description: item.reason || "Lịch khám", diagnosis: item.medical_records?.diagnosis || null, status: item.status, detail_url: `/patient/appointments/${item.id}` })),
      ...records.map((item) => ({ id: `record-${item.id}`, source_id: item.id, type: "MEDICAL_RECORD", date: item.created_at, doctor: nameOf(item.appointments?.schedules?.doctor_workplaces?.doctor_profiles?.users), clinic: item.appointments?.schedules?.doctor_workplaces?.clinics?.name || null, description: item.diagnosis || item.symptoms || "Bệnh án", status: item.appointments?.status, detail_url: `/patient/medical-records/${item.id}` })),
      ...prescriptions.map((item) => ({ id: `prescription-${item.id}`, source_id: item.id, type: "PRESCRIPTION", date: item.created_at, doctor: nameOf(item.medical_records?.appointments?.schedules?.doctor_workplaces?.doctor_profiles?.users), clinic: item.medical_records?.appointments?.schedules?.doctor_workplaces?.clinics?.name || null, description: item.note || "Đơn thuốc", status: "ISSUED", detail_url: `/patient/medical-records/${item.medical_record_id}` })),
      ...orders.map((item) => ({ id: `${item.service_type === "LAB" ? "lab" : "clinical"}-${item.id}`, source_id: item.id, type: item.service_type === "LAB" ? "LAB" : "CLINICAL", date: item.performed_at || item.ordered_at, doctor: nameOf(item.users), clinic: item.clinics?.name || null, description: item.lab_results.map((result) => result.service_name_snapshot || result.lab_tests?.name).filter(Boolean).join(", ") || item.indication || "Dịch vụ cận lâm sàng", status: item.status, detail_url: `/patient/clinical` })),
    ];
    const sortedEvents = sortTimelineEvents(events);
    const filtered = query.type && query.type !== "ALL" ? sortedEvents.filter((event) => event.type === query.type) : sortedEvents;
    return paginate(filtered, query.page, query.limit);
  }

  async medications(patientId, user) {
    await this.assertProfileAccess(user, patientId);
    const staffClinicId = user.role?.name === "STAFF" ? Number(user.clinic_id) : null;
    const records = await this.db.prescriptions.findMany({
      where: { medical_records: { appointments: { patient_profile_id: Number(patientId), ...(staffClinicId ? { schedules: { doctor_workplaces: { clinic_id: staffClinicId } } } : {}) } } },
      include: {
        prescription_details: { include: { medicines: true } },
        medical_records: { include: { appointments: { include: APPOINTMENT_DETAILS_INCLUDE } } },
      },
      orderBy: { created_at: "desc" },
    });
    return records.map((prescription) => ({
      id: prescription.id,
      date: prescription.created_at,
      doctor: nameOf(prescription.medical_records?.appointments?.schedules?.doctor_workplaces?.doctor_profiles?.users),
      medical_record_id: prescription.medical_record_id,
      note: prescription.note,
      items: prescription.prescription_details.map((item) => ({ id: item.id, name: item.medicines?.name, unit: item.medicines?.unit, quantity: item.quantity, dosage: item.dosage, instruction: item.instruction })),
      patient_reported_in_use: null,
    }));
  }

  async tests(patientId, user) {
    const profile = await this.assertProfileAccess(user, patientId);
    const staffClinicId = user.role?.name === "STAFF" ? Number(user.clinic_id) : null;
    const orders = await this.db.lab_orders.findMany({
      where: { patient_id: profile.id, ...(staffClinicId ? { clinic_id: staffClinicId } : {}) },
      select: { id: true, service_type: true, status: true, indication: true, ordered_at: true, performed_at: true, completed_at: true, clinics: { select: { id: true, name: true } }, users: { select: { id: true, first_name: true, last_name: true } }, lab_results: { select: { id: true, service_name_snapshot: true, result: true, unit: true, reference_range: true, findings: true, conclusion: true, measurements: true, note: true, lab_tests: { select: { name: true } } } }, clinical_attachments: { select: { id: true, kind: true, original_name: true, mime_type: true, created_at: true } } },
      orderBy: { ordered_at: "desc" },
    });
    return orders.map((order) => {
      const released = order.status === "COMPLETED";
      return {
        ...order,
        doctor_name: nameOf(order.users),
        users: undefined,
        lab_results: order.lab_results.map((result) => ({
          ...result,
          result: released ? result.result : null,
          unit: released ? result.unit : null,
          reference_range: released ? result.reference_range : null,
          findings: released ? result.findings : null,
          conclusion: released ? result.conclusion : null,
          measurements: released ? result.measurements : null,
          note: released ? result.note : null,
        })),
        clinical_attachments: released ? order.clinical_attachments.map((attachment) => ({
          ...attachment,
          download_url: `/api/clinical/attachments/${attachment.id}/file`,
        })) : [],
      };
    });
  }

  async createEntry(kind, patientId, user, data) {
    const role = user.role?.name;
    const isProfessional = PROFESSIONAL_ROLES.includes(role) && role !== "Admin";
    const profile = await this.assertProfileAccess(user, patientId, { write: true, professionalWrite: isProfessional });
    if (role !== "Patient" && role !== "Doctor") throw httpError("Chỉ bệnh nhân hoặc bác sĩ điều trị có thể ghi thông tin này", 403);
    const common = { patient_profile_id: profile.id };
    let model;
    let payload;
    if (kind === "history") {
      model = "patient_medical_history";
      payload = { ...common, title: data.title, discovered_at: data.discovered_at ? new Date(`${data.discovered_at}T00:00:00`) : null, description: data.description || null, surgery_history: data.surgery_history || null, family_history: data.family_history || null, source: isProfessional ? "CLINICIAN" : "PATIENT", reported_by: user.id, confirmation_status: isProfessional ? "CONFIRMED" : "PENDING", confirmed_by: isProfessional ? user.id : null, confirmed_at: isProfessional ? new Date() : null };
    } else if (kind === "allergies") {
      model = "patient_allergies";
      payload = { ...common, allergen: data.no_known_allergies ? "Không ghi nhận dị ứng đã biết" : data.allergen, allergy_type: data.allergy_type || "OTHER", source: isProfessional ? "CLINICIAN" : "PATIENT", reported_by: user.id, reaction: data.reaction || null, severity: data.severity || null, confirmation_status: isProfessional ? "CONFIRMED" : data.no_known_allergies ? "PATIENT_REPORTED_NONE" : "PENDING", confirmed_by: isProfessional ? user.id : null, confirmed_at: isProfessional ? new Date() : null };
    } else if (kind === "conditions") {
      model = "patient_conditions";
      const linkedRecord = data.medical_record_id == null ? null : await this.db.medical_records.findFirst({
        where: {
          id: Number(data.medical_record_id),
          appointments: {
            patient_profile_id: profile.id,
            ...(role === "Doctor" ? { schedules: { doctor_workplaces: { doctor_id: Number(user.id) } } } : {}),
          },
        },
        select: { id: true },
      });
      if (data.medical_record_id != null && !linkedRecord) throw httpError("Không tìm thấy bệnh án liên quan trong hồ sơ này", 404);
      payload = { ...common, name: data.name, recorded_at: data.recorded_at ? new Date(data.recorded_at) : new Date(), status: "MONITORING", note: data.note || null, medical_record_id: linkedRecord?.id ?? null, recorded_by: user.id, confirmation_status: isProfessional ? "CONFIRMED" : "PENDING", confirmed_by: isProfessional ? user.id : null, confirmed_at: isProfessional ? new Date() : null };
    } else if (kind === "vitals") {
      const vital = validateVitalInput(data);
      model = "patient_vitals";
      payload = { ...common, type: vital.type, value: vital.value, secondary_value: vital.secondary_value ?? null, unit: vital.unit, measured_at: new Date(vital.measured_at), source: isProfessional ? "CLINICIAN" : "PATIENT", recorded_by: user.id };
    } else throw httpError("Loại dữ liệu không hợp lệ");
    const created = await this.db[model].create({ data: payload });
    await this.audit.record({ userId: user.id, action: "CREATE", resource: "PATIENT", resourceId: profile.id, metadata: { category: kind, entryId: created.id } });
    return created;
  }

  async updateEntry(kind, patientId, entryId, user, data) {
    const profile = await this.assertProfileAccess(user, patientId, { write: true, professionalWrite: true });
    const model = { history: "patient_medical_history", allergies: "patient_allergies", conditions: "patient_conditions", vitals: "patient_vitals" }[kind];
    if (!model) throw httpError("Loại dữ liệu không hợp lệ");
    const id = parseId(entryId, "Mã dữ liệu");
    const entry = await this.db[model].findFirst({ where: { id, patient_profile_id: profile.id, deleted_at: null } });
    if (!entry) throw httpError("Không tìm thấy dữ liệu", 404);
    const role = user.role?.name;
    const confirmationOnly = Object.keys(data).every((key) => key === "confirmation_status");
    const isProfessional = PROFESSIONAL_ROLES.includes(role) && !["PATIENT_REPORTED_NONE", "PENDING"].includes(data.confirmation_status);
    if (role === "Patient" && entry.confirmation_status === "CONFIRMED" && !confirmationOnly) throw httpError("Thông tin đã được xác nhận, vui lòng liên hệ nhân viên y tế để chỉnh sửa", 403);
    if (role === "STAFF") throw httpError("Nhân viên chỉ được xem dữ liệu hồ sơ", 403);
    const payload = {};
    const allowed = {
      history: ["title", "discovered_at", "description", "surgery_history", "family_history"],
      allergies: ["allergen", "allergy_type", "reaction", "severity"],
      conditions: ["name", "recorded_at", "status", "note", "medical_record_id"],
      vitals: ["type", "value", "secondary_value", "unit", "measured_at"],
    }[kind];
    for (const key of allowed) if (data[key] !== undefined) payload[key] = data[key];
    if (kind === "conditions" && data.medical_record_id !== undefined) {
      const linkedRecord = data.medical_record_id == null ? null : await this.db.medical_records.findFirst({
        where: {
          id: Number(data.medical_record_id),
          appointments: {
            patient_profile_id: profile.id,
            ...(role === "Doctor" ? { schedules: { doctor_workplaces: { doctor_id: Number(user.id) } } } : {}),
          },
        },
        select: { id: true },
      });
      if (data.medical_record_id != null && !linkedRecord) throw httpError("Không tìm thấy bệnh án liên quan trong hồ sơ này", 404);
      payload.medical_record_id = linkedRecord?.id ?? null;
    }
    if (data.confirmation_status !== undefined) {
      if (!isProfessional) throw httpError("Chỉ bác sĩ điều trị mới có thể xác nhận thông tin", 403);
      if (!["CONFIRMED", "REJECTED"].includes(data.confirmation_status)) throw httpError("Trạng thái xác nhận không hợp lệ");
      payload.confirmation_status = data.confirmation_status;
      payload.confirmed_by = user.id;
      payload.confirmed_at = new Date();
    }
    if (kind === "conditions" && data.status && !isProfessional && data.status !== entry.status) throw httpError("Chỉ nhân viên y tế có thể cập nhật trạng thái theo dõi", 403);
    if (kind === "vitals" && (data.type !== undefined || data.value !== undefined || data.unit !== undefined)) {
      Object.assign(payload, validateVitalInput({ ...entry, ...payload, ...data }));
    }
    for (const key of ["discovered_at", "recorded_at", "measured_at"]) if (payload[key]) payload[key] = new Date(payload[key]);
    const updated = await this.db[model].update({ where: { id }, data: payload });
    await this.audit.record({ userId: user.id, action: "UPDATE", resource: "PATIENT", resourceId: profile.id, metadata: { category: kind, entryId: id, confirmationChanged: Boolean(payload.confirmation_status) } });
    return updated;
  }

  async deleteEntry(kind, patientId, entryId, user) {
    const profile = await this.assertProfileAccess(user, patientId, { write: true });
    if (user.role?.name !== "Patient" && user.role?.name !== "Admin") throw httpError("Bạn không có quyền xóa dữ liệu này", 403);
    const model = { history: "patient_medical_history", allergies: "patient_allergies", conditions: "patient_conditions", vitals: "patient_vitals" }[kind];
    const id = parseId(entryId, "Mã dữ liệu");
    const entry = await this.db[model].findFirst({ where: { id, patient_profile_id: profile.id, deleted_at: null } });
    if (!entry) throw httpError("Không tìm thấy dữ liệu", 404);
    await this.db[model].update({ where: { id }, data: { deleted_at: new Date() } });
    await this.audit.record({ userId: user.id, action: "DELETE", resource: "PATIENT", resourceId: profile.id, metadata: { category: kind, entryId: id } });
  }
}

export { VITALS };
export default new HealthRecordService();
