import labRepository from "../repositories/lab.repository.js";
import {
  formatDateDisplay,
  formatDateOnly,
  formatTimeOnly,
  parseDateOnly,
} from "../utils/datetime.js";

export const CLINICAL_SERVICE_LABELS = {
  LAB: "Xét nghiệm",
  XRAY: "X-quang",
  ULTRASOUND: "Siêu âm",
  ENDOSCOPY: "Nội soi",
  ECG: "Điện tim",
};

export const CLINICAL_BOOKING_MODE_LABELS = {
  DOCTOR_ORDER: "Cần bác sĩ chỉ định",
  SELF_BOOKING: "Bệnh nhân được tự đặt",
};

function httpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

function assertUserRole(currentUser, allowedRoles, message = "Bạn không có quyền thực hiện thao tác này") {
  if (!allowedRoles.includes(currentUser?.role?.name)) {
    throw httpError(message, 403);
  }
}

function parseId(value, label = "ID") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(`${label} không hợp lệ`, 400);
  }
  return id;
}

function todayInVietnam() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function createClinicalBookingCode(serviceType = "LAB") {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const prefix = {
    LAB: "XN",
    XRAY: "XQ",
    ULTRASOUND: "SA",
    ENDOSCOPY: "NS",
    ECG: "DT",
  }[serviceType] || "CLS";
  return `${prefix}-${timestamp}-${random}`;
}

function isUpcomingSchedule(workDate, startTime) {
  const timestamp = new Date(`${workDate}T${startTime}:00+07:00`).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function formatUserName(user) {
  return [user?.last_name, user?.first_name].filter(Boolean).join(" ") || null;
}

function formatService(test) {
  if (!test) return null;
  const bookingMode = test.booking_mode || "DOCTOR_ORDER";
  return {
    ...test,
    service_type: test.service_type || "LAB",
    service_type_label:
      CLINICAL_SERVICE_LABELS[test.service_type || "LAB"] || test.service_type,
    booking_mode: bookingMode,
    booking_mode_label:
      CLINICAL_BOOKING_MODE_LABELS[bookingMode] || bookingMode,
    price: Number(test.price || 0),
  };
}

function formatSchedule(schedule) {
  if (!schedule) return null;
  const workDate = formatDateOnly(schedule.work_date);
  const startTime = formatTimeOnly(schedule.start_time);
  const endTime = formatTimeOnly(schedule.end_time);
  return {
    id: schedule.id,
    service_type: schedule.service_type || "LAB",
    service_type_label:
      CLINICAL_SERVICE_LABELS[schedule.service_type || "LAB"] ||
      schedule.service_type,
    clinic_id: schedule.clinic_id,
    clinic_name: schedule.clinics?.name || null,
    clinic_address: schedule.clinics?.address || null,
    clinic_phone: schedule.clinics?.phone || null,
    work_date: workDate,
    date_display: formatDateDisplay(workDate),
    start_time: startTime,
    end_time: endTime,
    time: `${startTime} - ${endTime}`,
    max_orders: schedule.max_orders,
    booked_orders: schedule.booked_orders,
    order_count: schedule._count?.lab_orders ?? schedule.booked_orders,
    remaining: Math.max(schedule.max_orders - schedule.booked_orders, 0),
    available: schedule.is_active && schedule.booked_orders < schedule.max_orders,
    is_active: schedule.is_active,
    created_at: schedule.created_at,
    updated_at: schedule.updated_at,
  };
}

function formatResult(item) {
  if (!item) return null;
  return {
    id: item.id,
    order_id: item.lab_order_id,
    test_id: item.test_id,
    service_name:
      item.service_name_snapshot || item.lab_tests?.name || null,
    test_name: item.service_name_snapshot || item.lab_tests?.name || null,
    service_type: item.lab_tests?.service_type || null,
    price: Number(item.price_snapshot ?? item.lab_tests?.price ?? 0),
    result: item.result,
    unit: item.unit,
    reference_range: item.reference_range,
    findings: item.findings,
    conclusion: item.conclusion,
    measurements: item.measurements,
    note: item.note,
    created_by: item.created_by,
    created_by_name: formatUserName(item.users),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function redactUnreleasedResult(item) {
  return {
    ...item,
    result: null,
    unit: null,
    reference_range: null,
    findings: null,
    conclusion: null,
    measurements: null,
    note: null,
    created_by: null,
    created_by_name: null,
    created_at: null,
    updated_at: null,
  };
}

function formatAttachment(item) {
  if (!item) return null;
  return {
    id: item.id,
    order_id: item.lab_order_id,
    kind: item.kind,
    name: item.original_name,
    mime_type: item.mime_type,
    size: item.file_size,
    uploaded_by: item.uploaded_by,
    uploaded_by_name: formatUserName(item.users),
    created_at: item.created_at,
    download_url: `/api/clinical/attachments/${item.id}/file`,
  };
}

function formatEvent(item) {
  const metadata = item.metadata && typeof item.metadata === "object"
    ? { ...item.metadata }
    : item.metadata;
  if (metadata && typeof metadata === "object") {
    delete metadata.storage_path;
  }
  return {
    id: item.id,
    event_type: item.event_type,
    from_status: item.from_status,
    to_status: item.to_status,
    actor_id: item.actor_id,
    actor_name: formatUserName(item.users),
    reason: item.reason,
    metadata,
    created_at: item.created_at,
  };
}

function formatOrder(order, currentUser = null) {
  if (!order) return null;
  const serviceType = order.service_type || "LAB";
  const hideUnreleased =
    currentUser?.role?.name === "Patient" && order.status !== "COMPLETED";
  const results = (order.lab_results || []).map(formatResult);
  return {
    id: order.id,
    service_type: serviceType,
    service_type_label: CLINICAL_SERVICE_LABELS[serviceType] || serviceType,
    appointment_id: order.appointment_id,
    medical_record_id: order.appointments?.medical_records?.id || null,
    lab_schedule_id: order.lab_schedule_id,
    booking_code: order.booking_code || order.appointments?.booking_code || null,
    lab_booking_code: order.booking_code || null,
    appointment_booking_code: order.appointments?.booking_code || null,
    indication: order.indication || null,
    preparation_note: order.preparation_note || null,
    patient_note: order.patient_note || null,
    result_file: !hideUnreleased && order.result_file_path
      ? {
          name: order.result_file_name,
          type: order.result_file_type,
          size: order.result_file_size,
          uploaded_at: order.result_uploaded_at,
        }
      : null,
    patient_id: order.patient_id,
    patient_name: order.patient_profiles?.full_name || null,
    patient_phone: order.patient_profiles?.phone || null,
    doctor_id: order.doctor_id,
    doctor_name: formatUserName(order.users),
    accepted_by: order.accepted_by,
    accepted_by_name: formatUserName(order.accepted_by_user),
    performed_by: order.performed_by,
    performed_by_name: formatUserName(order.performed_by_user),
    status: order.status,
    ordered_at: order.ordered_at,
    started_at: order.started_at,
    performed_at: order.performed_at,
    completed_at: order.completed_at,
    cancelled_at: order.cancelled_at,
    cancellation_reason: order.cancellation_reason,
    updated_at: order.updated_at,
    schedule: formatSchedule(order.lab_schedules),
    results: hideUnreleased ? results.map(redactUnreleasedResult) : results,
    attachments: hideUnreleased
      ? []
      : (order.clinical_attachments || []).map(formatAttachment),
    events: hideUnreleased
      ? (order.clinical_order_events || [])
          .filter((item) => ["CREATED", "STATUS_CHANGED"].includes(item.event_type))
          .map(formatEvent)
      : (order.clinical_order_events || []).map(formatEvent),
  };
}

function getAttachmentKind(mimeType) {
  if (mimeType?.startsWith("image/")) return "IMAGE";
  if (mimeType?.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

class LabService {
  buildServiceWhere(query, forcedServiceType = null) {
    const where = {};
    if (query.search) where.name = { contains: query.search };
    if (typeof query.is_active === "boolean") where.is_active = query.is_active;
    if (query.booking_mode) where.booking_mode = query.booking_mode;
    if (forcedServiceType || query.service_type) {
      where.service_type = forcedServiceType || query.service_type;
    }
    return where;
  }

  async getTests(query, forcedServiceType = null) {
    const tests = await labRepository.findTests(
      this.buildServiceWhere(query, forcedServiceType),
    );
    return tests.map(formatService);
  }

  async getServices(query) {
    const result = await labRepository.findServices(
      this.buildServiceWhere(query),
      query,
    );
    return {
      ...result,
      total_pages: Math.ceil(result.total / result.limit) || 0,
      data: result.services.map(formatService),
    };
  }

  async getClinicalStatistics(currentUser) {
    assertUserRole(
      currentUser,
      ["Admin"],
      "Chỉ quản trị viên được xem thống kê cận lâm sàng",
    );
    const statistics = await labRepository.getClinicalStatistics();
    return {
      total_orders: statistics.total,
      by_status: statistics.byStatus,
      by_service_type: statistics.byServiceType,
    };
  }

  async createTest(data, forcedServiceType = "LAB") {
    const test = await labRepository.createTest({
      ...data,
      service_type: forcedServiceType,
      booking_mode: data.booking_mode || "SELF_BOOKING",
    });
    return formatService(test);
  }

  async createService(data) {
    const test = await labRepository.createTest({
      ...data,
      booking_mode:
        data.booking_mode ||
        (data.service_type === "LAB" ? "SELF_BOOKING" : "DOCTOR_ORDER"),
    });
    return formatService(test);
  }

  async getTestById(
    id,
    publicOnly = false,
    forcedServiceType = null,
    requiredBookingMode = null,
  ) {
    const test = await labRepository.findTestById(parseId(id, "ID dịch vụ"));
    if (
      !test ||
      (publicOnly && !test.is_active) ||
      (forcedServiceType && test.service_type !== forcedServiceType) ||
      (requiredBookingMode && test.booking_mode !== requiredBookingMode)
    ) {
      throw httpError("Không tìm thấy dịch vụ cận lâm sàng", 404);
    }
    return formatService(test);
  }

  async updateTest(id, data, forcedServiceType = "LAB") {
    const serviceId = parseId(id, "ID dịch vụ");
    const existing = await labRepository.findTestById(serviceId);
    if (!existing || existing.service_type !== forcedServiceType) {
      throw httpError("Không tìm thấy xét nghiệm", 404);
    }
    const { service_type: _ignored, ...payload } = data;
    const test = await labRepository.updateTest(serviceId, payload);
    return formatService(test);
  }

  async updateService(id, data) {
    const serviceId = parseId(id, "ID dịch vụ");
    const existing = await labRepository.findTestById(serviceId);
    if (!existing) throw httpError("Không tìm thấy dịch vụ cận lâm sàng", 404);

    if (data.service_type && data.service_type !== existing.service_type) {
      const usageCount = await labRepository.countResultUsesByTestId(serviceId);
      if (usageCount > 0) {
        throw httpError(
          "Không thể đổi loại của dịch vụ đã phát sinh phiếu chỉ định",
          409,
        );
      }
    }
    return formatService(await labRepository.updateTest(serviceId, data));
  }

  async deleteService(id, forcedServiceType = null) {
    const serviceId = parseId(id, "ID dịch vụ");
    const existing = await labRepository.findTestById(serviceId);
    if (!existing || (forcedServiceType && existing.service_type !== forcedServiceType)) {
      throw httpError("Không tìm thấy dịch vụ cận lâm sàng", 404);
    }
    if (!existing.is_active) return formatService(existing);
    return formatService(
      await labRepository.updateTest(serviceId, { is_active: false }),
    );
  }

  async createOrder(data, currentUser, forcedServiceType = null) {
    assertUserRole(
      currentUser,
      ["Admin", "Doctor"],
      "Chỉ bác sĩ hoặc quản trị viên được tạo chỉ định cận lâm sàng",
    );
    const appointment = await labRepository.findAppointmentForOrder(
      parseId(data.appointment_id, "ID lịch hẹn"),
    );
    if (!appointment) throw httpError("Không tìm thấy lịch hẹn", 404);
    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
      throw httpError("Không thể tạo chỉ định cho lịch đã hủy hoặc hoàn thành", 400);
    }

    const appointmentDoctorId =
      appointment.schedules?.doctor_workplaces?.doctor_id;
    if (!appointmentDoctorId) {
      throw httpError("Lịch hẹn chưa có bác sĩ phụ trách", 400);
    }
    if (
      currentUser.role?.name === "Doctor" &&
      Number(appointmentDoctorId) !== Number(currentUser.id)
    ) {
      throw httpError("Bác sĩ chỉ được chỉ định cho lịch khám của mình", 403);
    }

    const serviceType = forcedServiceType || data.service_type;
    const serviceIds = data.service_ids || data.test_ids;
    const tests = await labRepository.findTests({
      id: { in: serviceIds },
      service_type: serviceType,
      is_active: true,
    });
    if (tests.length !== serviceIds.length) {
      throw httpError(
        "Có dịch vụ không tồn tại, sai loại hoặc đã ngừng hoạt động",
        400,
      );
    }

    const order = await labRepository.createOrder({
      serviceType,
      appointmentId: appointment.id,
      labScheduleId: null,
      patientId: appointment.patient_profile_id,
      doctorId: Number(appointmentDoctorId),
      actorId: Number(currentUser.id),
      bookingCode: null,
      indication: data.indication,
      preparationNote: data.preparation_note,
      patientNote: null,
      tests,
    });
    return formatOrder(order, currentUser);
  }

  async createPatientOrder(data, currentUser, forcedServiceType = "LAB") {
    assertUserRole(
      currentUser,
      ["Patient"],
      "Chỉ bệnh nhân được tự đặt lịch cận lâm sàng",
    );
    const serviceType = forcedServiceType || data.service_type;
    const serviceIds = data.service_ids || data.test_ids;
    const scheduleId = data.schedule_id || data.lab_schedule_id;
    const profile = await labRepository.findPatientProfile(
      parseId(data.patient_id, "ID hồ sơ bệnh nhân"),
    );
    if (!profile) throw httpError("Không tìm thấy hồ sơ bệnh nhân", 404);
    if (Number(profile.account_id) !== Number(currentUser.id)) {
      throw httpError("Bạn chỉ được đặt dịch vụ cho hồ sơ của mình", 403);
    }

    const tests = await labRepository.findTests({
      id: { in: serviceIds },
      service_type: serviceType,
      booking_mode: "SELF_BOOKING",
      is_active: true,
    });
    if (tests.length !== serviceIds.length) {
      throw httpError(
        "Có dịch vụ không tồn tại, đã ngừng hoạt động hoặc cần bác sĩ chỉ định",
        400,
      );
    }

    const schedule = await labRepository.findScheduleById(scheduleId);
    if (
      !schedule ||
      schedule.service_type !== serviceType ||
      !schedule.is_active ||
      schedule.clinics?.is_active === false
    ) {
      throw httpError("Khung giờ dịch vụ không còn hoạt động hoặc không đúng loại", 400);
    }
    const workDate = formatDateOnly(schedule.work_date);
    const startTime = formatTimeOnly(schedule.start_time);
    if (!isUpcomingSchedule(workDate, startTime)) {
      throw httpError("Không thể đặt lịch cận lâm sàng trong quá khứ", 400);
    }
    if (schedule.booked_orders >= schedule.max_orders) {
      throw httpError("Khung giờ dịch vụ đã hết chỗ", 409);
    }

    const order = await labRepository.createOrder({
      serviceType,
      appointmentId: null,
      labScheduleId: scheduleId,
      patientId: profile.id,
      doctorId: null,
      actorId: Number(currentUser.id),
      bookingCode: createClinicalBookingCode(serviceType),
      indication: null,
      preparationNote: null,
      patientNote: data.patient_note,
      tests,
    });
    return formatOrder(order, currentUser);
  }

  async getSchedules(query, publicOnly = false, forcedServiceType = null) {
    const filters = {
      ...query,
      service_type: forcedServiceType || query.service_type,
      ...(publicOnly
        ? {
            is_active: true,
            available_only: true,
            from_date: query.from_date || todayInVietnam(),
          }
        : {}),
    };
    const result = await labRepository.findSchedules(filters);
    const schedules = publicOnly
      ? result.schedules.filter(
          (schedule) =>
            schedule.clinics?.is_active !== false &&
            isUpcomingSchedule(
              formatDateOnly(schedule.work_date),
              formatTimeOnly(schedule.start_time),
            ),
        )
      : result.schedules;
    return {
      ...result,
      total: publicOnly ? schedules.length : result.total,
      total_pages:
        Math.ceil(
          (publicOnly ? schedules.length : result.total) / result.limit,
        ) || 0,
      data: schedules.map(formatSchedule),
    };
  }

  async createSchedule(data, forcedServiceType = "LAB") {
    const clinic = await labRepository.findClinic(data.clinic_id);
    if (!clinic) throw httpError("Không tìm thấy cơ sở cận lâm sàng", 404);
    if (!isUpcomingSchedule(data.work_date, data.start_time)) {
      throw httpError("Không thể tạo lịch cận lâm sàng trong quá khứ", 400);
    }
    try {
      return formatSchedule(
        await labRepository.createSchedule({
          ...data,
          service_type: forcedServiceType || data.service_type,
        }),
      );
    } catch (error) {
      if (error.code === "P2002") {
        throw httpError("Khung giờ này đã tồn tại tại cơ sở đã chọn", 409);
      }
      throw error;
    }
  }

  async updateSchedule(id, data, forcedServiceType = "LAB") {
    const scheduleId = parseId(id, "ID lịch cận lâm sàng");
    const existing = await labRepository.findScheduleById(scheduleId);
    if (
      !existing ||
      (forcedServiceType && existing.service_type !== forcedServiceType)
    ) {
      throw httpError("Không tìm thấy khung giờ cận lâm sàng", 404);
    }
    if (data.clinic_id) {
      const clinic = await labRepository.findClinic(data.clinic_id);
      if (!clinic) throw httpError("Không tìm thấy cơ sở xét nghiệm", 404);
    }
    const workDate = data.work_date || formatDateOnly(existing.work_date);
    const startTime = data.start_time || formatTimeOnly(existing.start_time);
    const endTime = data.end_time || formatTimeOnly(existing.end_time);
    const structuralChanged =
      (data.clinic_id !== undefined && Number(data.clinic_id) !== existing.clinic_id) ||
      (data.service_type !== undefined && data.service_type !== existing.service_type) ||
      (data.work_date !== undefined && data.work_date !== formatDateOnly(existing.work_date)) ||
      (data.start_time !== undefined && data.start_time.slice(0, 5) !== formatTimeOnly(existing.start_time)) ||
      (data.end_time !== undefined && data.end_time.slice(0, 5) !== formatTimeOnly(existing.end_time));
    if (structuralChanged && !isUpcomingSchedule(workDate, startTime)) {
      throw httpError("Không thể chuyển lịch xét nghiệm về ngày trong quá khứ", 400);
    }
    if (startTime >= endTime) {
      throw httpError("Giờ kết thúc phải sau giờ bắt đầu", 400);
    }
    if (data.max_orders !== undefined && data.max_orders < existing.booked_orders) {
      throw httpError("Sức chứa không được nhỏ hơn số lượt đã đặt", 400);
    }
    if (existing.booked_orders > 0 && structuralChanged) {
      throw httpError("Không thể đổi cơ sở hoặc thời gian khi đã có người đặt", 400);
    }
    try {
      return formatSchedule(await labRepository.updateSchedule(scheduleId, data));
    } catch (error) {
      if (error.code === "P2002") {
        throw httpError("Khung giờ này đã tồn tại tại cơ sở đã chọn", 409);
      }
      throw error;
    }
  }

  async deleteSchedule(id, forcedServiceType = "LAB") {
    const scheduleId = parseId(id, "ID lịch cận lâm sàng");
    const existing = await labRepository.findScheduleById(scheduleId);
    if (
      !existing ||
      (forcedServiceType && existing.service_type !== forcedServiceType)
    ) {
      throw httpError("Không tìm thấy khung giờ cận lâm sàng", 404);
    }
    if (existing.booked_orders > 0 || existing._count?.lab_orders > 0) {
      throw httpError("Không thể xóa khung giờ đã có người đặt", 400);
    }
    await labRepository.deleteSchedule(scheduleId);
    return { id: scheduleId };
  }

  buildOrderWhere(query, currentUser, forcedServiceType = null) {
    const where = {};
    if (query.status) where.status = query.status;
    if (forcedServiceType || query.service_type) {
      where.service_type = forcedServiceType || query.service_type;
    }
    if (query.appointment_id) where.appointment_id = query.appointment_id;
    if (query.lab_schedule_id) where.lab_schedule_id = query.lab_schedule_id;
    if (query.patient_id) where.patient_id = query.patient_id;
    if (query.doctor_id) where.doctor_id = query.doctor_id;
    if (query.from_date || query.to_date) {
      where.ordered_at = {};
      if (query.from_date) where.ordered_at.gte = parseDateOnly(query.from_date);
      if (query.to_date) {
        const exclusiveEnd = parseDateOnly(query.to_date);
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
        where.ordered_at.lt = exclusiveEnd;
      }
    }
    if (query.search) {
      where.OR = [
        { booking_code: { contains: query.search } },
        { appointments: { booking_code: { contains: query.search } } },
        { patient_profiles: { full_name: { contains: query.search } } },
        {
          lab_results: {
            some: { lab_tests: { name: { contains: query.search } } },
          },
        },
      ];
    }

    if (currentUser.role?.name === "Doctor") {
      where.doctor_id = Number(currentUser.id);
    } else if (currentUser.role?.name === "Patient") {
      where.patient_profiles = { account_id: Number(currentUser.id) };
    }
    return where;
  }

  async getOrders(query, currentUser, forcedServiceType = null) {
    if (currentUser.role?.name === "Doctor" && query.doctor_id) {
      if (Number(query.doctor_id) !== Number(currentUser.id)) {
        throw httpError("Bác sĩ không được xem lịch sử của bác sĩ khác", 403);
      }
    }
    if (currentUser.role?.name === "Patient" && query.patient_id) {
      const profile = await labRepository.findPatientProfile(query.patient_id);
      if (!profile || Number(profile.account_id) !== Number(currentUser.id)) {
        throw httpError("Hồ sơ bệnh nhân không thuộc tài khoản của bạn", 403);
      }
    }
    const result = await labRepository.findOrders(
      this.buildOrderWhere(query, currentUser, forcedServiceType),
      query,
    );
    return {
      ...result,
      total_pages: Math.ceil(result.total / result.limit) || 0,
      data: result.orders.map((order) => formatOrder(order, currentUser)),
    };
  }

  assertCanViewOrder(order, currentUser) {
    const role = currentUser.role?.name;
    if (role === "Admin" || role === "STAFF") return;
    if (role === "Doctor" && Number(order.doctor_id) === Number(currentUser.id)) {
      return;
    }
    if (
      role === "Patient" &&
      Number(order.patient_profiles?.account_id) === Number(currentUser.id)
    ) {
      return;
    }
    throw httpError("Bạn không có quyền xem phiếu cận lâm sàng này", 403);
  }

  async getOrderEntity(id, currentUser, forcedServiceType = null) {
    const order = await labRepository.findOrderById(
      parseId(id, "ID phiếu cận lâm sàng"),
    );
    if (!order || (forcedServiceType && order.service_type !== forcedServiceType)) {
      throw httpError("Không tìm thấy phiếu cận lâm sàng", 404);
    }
    this.assertCanViewOrder(order, currentUser);
    return order;
  }

  async getOrderById(id, currentUser, forcedServiceType = null) {
    return formatOrder(
      await this.getOrderEntity(id, currentUser, forcedServiceType),
      currentUser,
    );
  }

  async updateOrderStatus(id, payload, currentUser, forcedServiceType = null) {
    assertUserRole(
      currentUser,
      ["Admin", "STAFF"],
      "Chỉ nhân viên cận lâm sàng hoặc quản trị viên được cập nhật trạng thái",
    );
    const order = await this.getOrderEntity(id, currentUser, forcedServiceType);
    const status = typeof payload === "string" ? payload : payload.status;
    const cancellationReason =
      typeof payload === "string" ? null : payload.cancellation_reason;
    const allowedTransitions = {
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!allowedTransitions[order.status]?.includes(status)) {
      throw httpError(
        `Không thể chuyển trạng thái từ ${order.status} sang ${status}`,
        400,
      );
    }
    return formatOrder(
      await labRepository.updateOrderStatus(
        order.id,
        status,
        currentUser.id,
        cancellationReason,
      ),
      currentUser,
    );
  }

  assertOrderCanBeEdited(order) {
    if (order.status === "COMPLETED") {
      throw httpError("Không thể sửa phiếu đã hoàn thành", 409);
    }
    if (order.status === "CANCELLED") {
      throw httpError("Không thể sửa phiếu đã hủy", 409);
    }
  }

  async createResult(orderId, data, currentUser) {
    assertUserRole(
      currentUser,
      ["Admin", "STAFF"],
      "Chỉ nhân viên cận lâm sàng hoặc quản trị viên được nhập kết quả",
    );
    const order = await this.getOrderEntity(orderId, currentUser);
    this.assertOrderCanBeEdited(order);
    const test = await labRepository.findTestById(data.test_id);
    if (!test || test.service_type !== order.service_type) {
      throw httpError("Dịch vụ kết quả không thuộc loại của phiếu chỉ định", 400);
    }
    if (!order.lab_results.some((item) => item.test_id === test.id)) {
      throw httpError("Dịch vụ này chưa có trong phiếu chỉ định", 400);
    }
    const { test_id: _testId, ...resultData } = data;
    return formatOrder(
      await labRepository.createOrUpdateResult(
        order.id,
        test,
        resultData,
        currentUser.id,
      ),
      currentUser,
    );
  }

  async getResultById(id, currentUser) {
    const result = await labRepository.findResultById(
      parseId(id, "ID kết quả"),
    );
    if (!result) throw httpError("Không tìm thấy kết quả cận lâm sàng", 404);
    const order = await this.getOrderEntity(result.lab_order_id, currentUser);
    if (currentUser.role?.name === "Patient" && order.status !== "COMPLETED") {
      throw httpError("Kết quả chỉ được xem sau khi phiếu hoàn thành", 403);
    }
    return formatResult(result);
  }

  async updateResult(
    orderId,
    resultId,
    data,
    currentUser,
    { forcedServiceType = null, autoComplete = false } = {},
  ) {
    assertUserRole(
      currentUser,
      ["Admin", "STAFF"],
      "Chỉ nhân viên cận lâm sàng hoặc quản trị viên được sửa kết quả",
    );
    const order = await this.getOrderEntity(
      orderId,
      currentUser,
      forcedServiceType,
    );
    this.assertOrderCanBeEdited(order);
    const updated = await labRepository.updateResult(
      order.id,
      parseId(resultId, "ID kết quả"),
      data,
      currentUser.id,
      { autoComplete },
    );
    if (!updated) throw httpError("Không tìm thấy kết quả cận lâm sàng", 404);
    return formatOrder(updated, currentUser);
  }

  async attachResultFile(id, file, currentUser) {
    assertUserRole(
      currentUser,
      ["Admin", "STAFF"],
      "Chỉ nhân viên cận lâm sàng hoặc quản trị viên được tải tệp kết quả",
    );
    const order = await this.getOrderEntity(id, currentUser, "LAB");
    this.assertOrderCanBeEdited(order);
    const updated = await labRepository.replaceLegacyResultFile(
      order.id,
      { ...file, kind: getAttachmentKind(file.mimeType) },
      currentUser.id,
    );
    return {
      data: formatOrder(updated, currentUser),
      previousFilePath: order.result_file_path || null,
    };
  }

  async getResultFile(id, currentUser) {
    const order = await this.getOrderEntity(id, currentUser, "LAB");
    if (currentUser.role?.name === "Patient" && order.status !== "COMPLETED") {
      throw httpError("Tệp kết quả chỉ được xem sau khi phiếu hoàn thành", 403);
    }
    if (!order.result_file_path) {
      throw httpError("Phiếu xét nghiệm chưa có file kết quả", 404);
    }
    return {
      path: order.result_file_path,
      name: order.result_file_name || "ket-qua-xet-nghiem",
      type: order.result_file_type || "application/octet-stream",
    };
  }

  async addAttachment(orderId, file, currentUser) {
    assertUserRole(
      currentUser,
      ["Admin", "STAFF"],
      "Chỉ nhân viên cận lâm sàng hoặc quản trị viên được tải tệp kết quả",
    );
    const order = await this.getOrderEntity(orderId, currentUser);
    this.assertOrderCanBeEdited(order);
    const updated = await labRepository.createAttachment(
      order.id,
      { ...file, kind: getAttachmentKind(file.mimeType) },
      currentUser.id,
    );
    return formatOrder(updated, currentUser);
  }

  async getAttachments(orderId, currentUser) {
    const order = await this.getOrderEntity(orderId, currentUser);
    if (currentUser.role?.name === "Patient" && order.status !== "COMPLETED") {
      return [];
    }
    return (order.clinical_attachments || []).map(formatAttachment);
  }

  async getAttachmentFile(id, currentUser) {
    const attachment = await labRepository.findAttachmentById(
      parseId(id, "ID tệp đính kèm"),
    );
    if (!attachment) throw httpError("Không tìm thấy tệp đính kèm", 404);
    this.assertCanViewOrder(attachment.lab_orders, currentUser);
    if (
      currentUser.role?.name === "Patient" &&
      attachment.lab_orders.status !== "COMPLETED"
    ) {
      throw httpError("Tệp kết quả chỉ được xem sau khi phiếu hoàn thành", 403);
    }
    return {
      path: attachment.storage_path,
      name: attachment.original_name,
      type: attachment.mime_type,
    };
  }

  async deleteAttachment(id, currentUser) {
    assertUserRole(
      currentUser,
      ["Admin", "STAFF"],
      "Chỉ nhân viên cận lâm sàng hoặc quản trị viên được xóa tệp kết quả",
    );
    const attachment = await labRepository.findAttachmentById(
      parseId(id, "ID tệp đính kèm"),
    );
    if (!attachment) throw httpError("Không tìm thấy tệp đính kèm", 404);
    this.assertOrderCanBeEdited(attachment.lab_orders);
    const deleted = await labRepository.deleteAttachment(
      attachment.id,
      currentUser.id,
    );
    return {
      id: deleted.id,
      storagePath: deleted.storage_path,
    };
  }

  async getOrderEvents(orderId, currentUser) {
    const order = await this.getOrderEntity(orderId, currentUser);
    return (order.clinical_order_events || []).map(formatEvent);
  }
}

export default new LabService();
