import appointmentRepository from "../repositories/appointment.repository.js";
import patientProfileRepository from "../repositories/patient-profile.repository.js";
import userRepository from "../repositories/user.repository.js";
import notificationService from "./notification.service.js";
import {
  formatDateOnly,
  formatTimeOnly,
  formatDateDisplay,
  formatDateTimeDisplay,
  formatClockTime,
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

class AppointmentService {
  // Lấy các bên liên quan của lịch hẹn (bác sĩ, bệnh nhân, mã đặt)
  getParties(appointment) {
    const doctorId =
      appointment?.schedules?.doctor_workplaces?.doctor_id ||
      appointment?.schedules?.doctor_workplaces?.doctor_profiles?.users?.id ||
      null;
    const patientAccountId =
      appointment?.patient_profiles?.account_id || null;
    const patientName =
      appointment?.patient_profiles?.full_name || "Bệnh nhân";
    const bookingCode = appointment?.booking_code || "";
    return { doctorId, patientAccountId, patientName, bookingCode };
  }

  // Gửi thông báo khi có lịch hẹn mới
  async notifyAppointmentCreated(appointment) {
    const formatted = this.formatAppointment(appointment);
    const { doctorId, patientAccountId, patientName, bookingCode } =
      this.getParties(appointment);

    const when = [formatted.date_display, formatted.time]
      .filter(Boolean)
      .join(" · ");

    if (doctorId) {
      await notificationService.notify(doctorId, {
        title: "Lịch hẹn mới",
        content: `${patientName} vừa đặt lịch ${bookingCode}${when ? ` (${when})` : ""}.`,
        link: `/doctor/appointments/${appointment.id}`,
        type: "APPOINTMENT",
      });
    }

    if (patientAccountId) {
      const hasUnpaidClinicFee = appointment.invoices?.some(
        (inv) => inv.invoice_type === "CLINIC_FEE" && inv.payment_status === "UNPAID",
      );
      const content = hasUnpaidClinicFee
        ? `Bạn đã đặt lịch ${bookingCode}${when ? ` vào ${when}` : ""}. Vui lòng hoàn tất thanh toán phí khám trong vòng 10 phút.`
        : `Bạn đã đặt lịch ${bookingCode}${when ? ` vào ${when}` : ""}. Vui lòng chờ xác nhận.`;

      await notificationService.notify(patientAccountId, {
        title: "Đặt lịch thành công",
        content,
        link: `/patient/appointments/${appointment.id}`,
        type: "APPOINTMENT",
      });
    }

    const adminIds = await userRepository.findIdsByRole("Admin");
    await notificationService.notifyMany(adminIds, {
      title: "Lịch hẹn mới trên hệ thống",
      content: `${patientName} đặt lịch ${bookingCode}${when ? ` (${when})` : ""}.`,
      link: "/admin/appointments",
      type: "APPOINTMENT",
    });
  }

  // Gửi thông báo khi trạng thái lịch hẹn thay đổi
  async notifyStatusChange(appointment, status, actorRole) {
    const formatted = this.formatAppointment(appointment);
    const { doctorId, patientAccountId, patientName, bookingCode } =
      this.getParties(appointment);

    const when = [formatted.date_display, formatted.time]
      .filter(Boolean)
      .join(" · ");

    if (status === "CONFIRMED") {
      if (patientAccountId) {
        await notificationService.notify(patientAccountId, {
          title: "Lịch hẹn đã được xác nhận",
          content: `Lịch ${bookingCode}${when ? ` (${when})` : ""} đã được xác nhận.`,
          link: `/patient/appointments/${appointment.id}`,
          type: "APPOINTMENT",
        });
      }
      return;
    }

    if (status === "CANCELLED") {
      if (actorRole === "Patient" && doctorId) {
        await notificationService.notify(doctorId, {
          title: "Bệnh nhân hủy lịch",
          content: `${patientName} đã hủy lịch ${bookingCode}.`,
          link: `/doctor/appointments/${appointment.id}`,
          type: "APPOINTMENT",
        });
      }

      if (actorRole !== "Patient" && patientAccountId) {
        await notificationService.notify(patientAccountId, {
          title: "Lịch hẹn đã bị hủy",
          content: `Lịch ${bookingCode}${when ? ` (${when})` : ""} đã bị hủy.`,
          link: `/patient/appointments/${appointment.id}`,
          type: "APPOINTMENT",
        });
      }

      if (actorRole === "Admin" && doctorId) {
        await notificationService.notify(doctorId, {
          title: "Admin hủy lịch hẹn",
          content: `Lịch ${bookingCode} của ${patientName} đã bị hủy bởi Admin.`,
          link: `/doctor/appointments/${appointment.id}`,
          type: "APPOINTMENT",
        });
      }
      return;
    }

    if (status === "COMPLETED" && patientAccountId) {
      await notificationService.notify(patientAccountId, {
        title: "Lịch khám đã hoàn thành",
        content: `Lịch ${bookingCode} đã hoàn thành. Bạn có thể xem bệnh án nếu đã được tạo.`,
        link: `/patient/appointments/${appointment.id}`,
        type: "APPOINTMENT",
      });
    }
  }

  // Sinh mã đặt lịch (booking_code)
  generateBookingCode() {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `BK${stamp}${rand}`;
  }

  // Chuẩn hóa định dạng dữ liệu lịch hẹn trả về cho API
  formatAppointment(appointment) {
    if (!appointment) return null;

    const schedule = appointment.schedules;
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
    const patient = appointment.patient_profiles;
    const fee =
      workplace?.consultation_fee ??
      workplace?.doctor_profiles?.consultation_fee ??
      0;
    const clinicalOrders = appointment.lab_orders || [];
    const incompleteClinicalOrderCount = clinicalOrders.filter(
      (order) => order.status === "PENDING" || order.status === "IN_PROGRESS",
    ).length;

    const clinicInvoice = (appointment.invoices || []).find(
      (inv) => inv.invoice_type === "CLINIC_FEE",
    );

    return {
      id: appointment.id,
      booking_code: appointment.booking_code,
      status: appointment.status,
      reason: appointment.reason || null,
      schedule_id: appointment.schedule_id,
      patient_profile_id: appointment.patient_profile_id,
      work_date: workDate,
      date_display: formatDateDisplay(workDate),
      start_time: startTime,
      end_time: endTime,
      time: startTime && endTime ? `${startTime} - ${endTime}` : null,
      doctor_id: workplace?.doctor_id || doctorUser?.id || null,
      doctor_name: doctorName,
      doctor_avatar: doctorUser?.avatar || null,
      specialty: workplace?.specialties?.name || null,
      specialty_id: workplace?.specialty_id || null,
      clinic: workplace?.clinics?.name || null,
      clinic_id: workplace?.clinic_id || null,
      clinic_address: workplace?.clinics?.address || null,
      consultation_fee: Number(fee),
      patient_name: patient?.full_name || null,
      patient_phone: patient?.phone || null,
      patient_gender: patient?.gender || null,
      patient_gender_label:
        genderLabel[patient?.gender] || patient?.gender || null,
      patient_date_of_birth: formatDateOnly(patient?.date_of_birth),
      patient_relationship: patient?.relationship || null,
      patient_relationship_label:
        relationshipLabel[patient?.relationship] ||
        patient?.relationship ||
        null,
      patient_blood_type: patient?.blood_type || null,
      patient_height:
        patient?.height != null ? Number(patient.height) : null,
      patient_weight:
        patient?.weight != null ? Number(patient.weight) : null,
      patient_insurance_number: patient?.insurance_number || null,
      patient_emergency_contact: patient?.emergency_contact || null,
      account_id: patient?.account_id || null,
      exam_started_at: appointment.exam_started_at || null,
      exam_started_at_display: formatDateTimeDisplay(
        appointment.exam_started_at,
      ),
      exam_started_time: formatClockTime(appointment.exam_started_at),
      has_medical_record: Boolean(appointment.medical_records?.id),
      clinical_order_count: clinicalOrders.length,
      incomplete_clinical_order_count: incompleteClinicalOrderCount,
      can_complete_exam:
        Boolean(appointment.medical_records?.id) &&
        incompleteClinicalOrderCount === 0,
      clinic_fee_invoice: clinicInvoice
        ? {
            id: clinicInvoice.id,
            amount: Number(clinicInvoice.amount),
            payment_status: clinicInvoice.payment_status,
            payment_expires_at: clinicInvoice.payment_expires_at,
            vnp_txn_ref: clinicInvoice.vnp_txn_ref || null,
          }
        : null,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
    };
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const appointmentId = Number(id);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      const error = new Error("ID lịch hẹn không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return appointmentId;
  }

  // Xây điều kiện lọc lịch hẹn theo quyền người dùng
  async buildWhereForUser(user, query) {
    const role = user.role?.name;
    const where = {};

    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { booking_code: { contains: query.search } },
        { reason: { contains: query.search } },
        {
          patient_profiles: {
            full_name: { contains: query.search },
          },
        },
      ];
    }

    if (role === "Admin") {
      if (query.doctor_id) {
        where.schedules = {
          doctor_workplaces: { doctor_id: query.doctor_id },
        };
      }
      return where;
    }

    if (role === "Doctor") {
      where.schedules = {
        doctor_workplaces: { doctor_id: user.id },
      };
      return where;
    }

    // Patient
    where.patient_profiles = { account_id: user.id };
    return where;
  }

  // Lấy danh sách lịch hẹn theo quyền người dùng
  async getAppointments(user, query) {
    const where = await this.buildWhereForUser(user, query);
    const { total, appointments, page, limit } =
      await appointmentRepository.findAll(where, query);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: appointments.map((a) => this.formatAppointment(a)),
    };
  }

  // Lấy chi tiết 1 lịch hẹn theo ID
  async getAppointmentById(user, id) {
    const appointmentId = this.parseId(id);
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      const error = new Error("Không tìm thấy lịch hẹn");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanView(user, appointment);
    return this.formatAppointment(appointment);
  }

  // Kiểm tra quyền xem lịch hẹn
  assertCanView(user, appointment) {
    const role = user.role?.name;
    if (role === "Admin") return;

    if (role === "Doctor") {
      const doctorId =
        appointment.schedules?.doctor_workplaces?.doctor_id ||
        appointment.schedules?.doctor_workplaces?.doctor_profiles?.users?.id;
      if (Number(doctorId) === Number(user.id)) return;
    }

    if (role === "Patient") {
      if (Number(appointment.patient_profiles?.account_id) === Number(user.id)) {
        return;
      }
    }

    const error = new Error("Bạn không có quyền xem lịch hẹn này");
    error.statusCode = 403;
    throw error;
  }

  // Tạo lịch hẹn mới (đặt lịch)
  async createAppointment(user, data) {
    if (user.role?.name !== "Patient" && user.role?.name !== "Admin") {
      const error = new Error("Chỉ bệnh nhân mới được đặt lịch");
      error.statusCode = 403;
      throw error;
    }

    const profile = await patientProfileRepository.findById(
      data.patient_profile_id,
    );

    if (!profile) {
      const error = new Error("Không tìm thấy hồ sơ bệnh nhân");
      error.statusCode = 404;
      throw error;
    }

    if (
      user.role?.name === "Patient" &&
      Number(profile.account_id) !== Number(user.id)
    ) {
      const error = new Error("Hồ sơ bệnh nhân không thuộc tài khoản của bạn");
      error.statusCode = 403;
      throw error;
    }

    const booking_code = this.generateBookingCode();

    const appointment = await appointmentRepository.createWithBooking({
      ...data,
      booking_code,
      skipAdvanceCheck: user.role?.name === "Admin",
    });

    try {
      await this.notifyAppointmentCreated(appointment);
    } catch {
      // Không chặn đặt lịch nếu gửi thông báo lỗi
    }

    return this.formatAppointment(appointment);
  }

  // Cập nhật trạng thái lịch hẹn
  async updateStatus(user, id, status) {
    const appointmentId = this.parseId(id);
    const existing = await appointmentRepository.findById(appointmentId);

    if (!existing) {
      const error = new Error("Không tìm thấy lịch hẹn");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanView(user, existing);

    const current = existing.status;
    const role = user.role?.name;

    const allowed = this.getAllowedTransitions(role, current);
    if (!allowed.includes(status)) {
      const error = new Error(
        `Không thể chuyển trạng thái từ ${current} sang ${status}`,
      );
      error.statusCode = 400;
      throw error;
    }

    if (status === "COMPLETED") {
      if (!existing.medical_records?.id) {
        const error = new Error(
          "Cần lưu hồ sơ bệnh án trước khi hoàn thành buổi khám",
        );
        error.statusCode = 400;
        throw error;
      }

      const incompleteClinicalOrders = (existing.lab_orders || []).filter(
        (order) => order.status === "PENDING" || order.status === "IN_PROGRESS",
      );
      if (incompleteClinicalOrders.length > 0) {
        const error = new Error(
          `Không thể hoàn thành buổi khám khi còn ${incompleteClinicalOrders.length} chỉ định cận lâm sàng chưa hoàn tất`,
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const releasing =
      (current === "PENDING" || current === "CONFIRMED") &&
      status === "CANCELLED";

    const updated = await appointmentRepository.updateStatus(
      appointmentId,
      status,
      { shouldReleaseSlot: releasing },
    );

    try {
      await this.notifyStatusChange(updated, status, role);
    } catch {
      // Không chặn cập nhật nếu gửi thông báo lỗi
    }

    return this.formatAppointment(updated);
  }

  // Bác sĩ bắt đầu khám — lưu thời điểm hiện tại
  async startExam(user, id) {
    const appointmentId = this.parseId(id);
    const existing = await appointmentRepository.findById(appointmentId);

    if (!existing) {
      const error = new Error("Không tìm thấy lịch hẹn");
      error.statusCode = 404;
      throw error;
    }

    this.assertCanView(user, existing);

    const role = user.role?.name;
    if (role !== "Doctor" && role !== "Admin") {
      const error = new Error("Chỉ bác sĩ được bắt đầu khám");
      error.statusCode = 403;
      throw error;
    }

    if (existing.status !== "CONFIRMED") {
      const error = new Error("Chỉ bắt đầu khám khi lịch đã được xác nhận");
      error.statusCode = 400;
      throw error;
    }

    if (existing.exam_started_at) {
      return this.formatAppointment(existing);
    }

    const updated = await appointmentRepository.markExamStarted(appointmentId);
    return this.formatAppointment(updated);
  }

  // Lấy các trạng thái được phép chuyển theo vai trò
  getAllowedTransitions(role, current) {
    if (role === "Admin") {
      if (current === "PENDING") return ["CONFIRMED", "CANCELLED"];
      if (current === "CONFIRMED") return ["COMPLETED", "CANCELLED"];
      return [];
    }

    if (role === "Doctor") {
      if (current === "PENDING") return ["CONFIRMED", "CANCELLED"];
      if (current === "CONFIRMED") return ["COMPLETED", "CANCELLED"];
      return [];
    }

    // Patient
    if (current === "PENDING" || current === "CONFIRMED") {
      return ["CANCELLED"];
    }
    return [];
  }
}

export default new AppointmentService();
