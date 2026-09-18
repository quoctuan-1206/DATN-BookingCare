import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { parseDateOnly, parseTimeOnly } from "../utils/datetime.js";

const userSummarySelect = {
  id: true,
  first_name: true,
  last_name: true,
};

const scheduleInclude = {
  clinics: {
    select: { id: true, name: true, address: true, phone: true, is_active: true },
  },
  _count: { select: { lab_orders: true } },
};

const orderInclude = {
  appointments: {
    select: {
      id: true,
      booking_code: true,
      status: true,
      medical_records: { select: { id: true } },
    },
  },
  patient_profiles: {
    select: {
      id: true,
      account_id: true,
      full_name: true,
      phone: true,
      date_of_birth: true,
    },
  },
  users: { select: userSummarySelect },
  accepted_by_user: { select: userSummarySelect },
  performed_by_user: { select: userSummarySelect },
  lab_schedules: { include: scheduleInclude },
  lab_results: {
    orderBy: { id: "asc" },
    include: {
      lab_tests: true,
      users: { select: userSummarySelect },
    },
  },
  clinical_attachments: {
    orderBy: { created_at: "asc" },
    include: { users: { select: userSummarySelect } },
  },
};

const orderDetailInclude = {
  ...orderInclude,
  clinical_order_events: {
    orderBy: [{ created_at: "asc" }, { id: "asc" }],
    include: { users: { select: userSummarySelect } },
  },
};

function activeWorkData(order, actorId, now = new Date()) {
  return {
    accepted_by: order.accepted_by ?? Number(actorId),
    started_at: order.started_at ?? now,
  };
}

function normalizeResultData(data) {
  if (data.measurements !== null) return data;
  return { ...data, measurements: Prisma.DbNull };
}

function transactionError(message, statusCode = 409) {
  return Object.assign(new Error(message), { statusCode });
}

function assertEditableOrder(order) {
  if (!order) throw transactionError("Không tìm thấy phiếu cận lâm sàng", 404);
  if (["COMPLETED", "CANCELLED"].includes(order.status)) {
    throw transactionError("Phiếu cận lâm sàng đã kết thúc");
  }
}

const MAX_ATTACHMENTS_PER_ORDER = 20;
const MAX_ATTACHMENT_BYTES_PER_ORDER = 100 * 1024 * 1024;

async function findLockedOrder(tx, id) {
  const orderId = Number(id);
  const rows = await tx.$queryRaw(
    Prisma.sql`SELECT id FROM lab_orders WHERE id = ${orderId} FOR UPDATE`,
  );
  if (!rows.length) return null;
  return tx.lab_orders.findUnique({ where: { id: orderId } });
}

function hasStoredResultContent(result) {
  const hasText = [result.result, result.findings, result.conclusion]
    .some((value) => typeof value === "string" && value.trim().length > 0);
  const measurements = result.measurements;
  const hasMeasurements = Boolean(
    measurements &&
      typeof measurements === "object" &&
      Object.keys(measurements).length > 0,
  );
  return hasText || hasMeasurements;
}

async function assertAttachmentQuota(
  tx,
  orderId,
  incomingSize,
  excludeStoragePath = null,
) {
  const where = { lab_order_id: Number(orderId) };
  if (excludeStoragePath) where.storage_path = { not: excludeStoragePath };
  const usage = await tx.clinical_attachments.aggregate({
    where,
    _count: { _all: true },
    _sum: { file_size: true },
  });
  if (usage._count._all >= MAX_ATTACHMENTS_PER_ORDER) {
    throw transactionError(
      `Mỗi phiếu chỉ được đính kèm tối đa ${MAX_ATTACHMENTS_PER_ORDER} tệp`,
      400,
    );
  }
  if (
    Number(usage._sum.file_size || 0) + Number(incomingSize) >
    MAX_ATTACHMENT_BYTES_PER_ORDER
  ) {
    throw transactionError(
      "Tổng dung lượng tệp của một phiếu không được vượt quá 100 MB",
      400,
    );
  }
}

class LabRepository {
  findTests(where = {}) {
    return prisma.lab_tests.findMany({ where, orderBy: { name: "asc" } });
  }

  async findServices(where, { page, limit }) {
    const skip = (page - 1) * limit;
    const [total, services] = await prisma.$transaction([
      prisma.lab_tests.count({ where }),
      prisma.lab_tests.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ service_type: "asc" }, { name: "asc" }],
      }),
    ]);
    return { total, services, page, limit };
  }

  findTestById(id) {
    return prisma.lab_tests.findUnique({ where: { id: Number(id) } });
  }

  countResultUsesByTestId(id) {
    return prisma.lab_results.count({ where: { test_id: Number(id) } });
  }

  createTest(data) {
    return prisma.lab_tests.create({ data });
  }

  updateTest(id, data) {
    return prisma.lab_tests.update({ where: { id: Number(id) }, data });
  }

  findAppointmentForOrder(id) {
    return prisma.appointments.findUnique({
      where: { id: Number(id) },
      include: {
        schedules: { include: { doctor_workplaces: true } },
        patient_profiles: { select: { id: true, account_id: true } },
        medical_records: { select: { id: true } },
      },
    });
  }

  findPatientProfile(id) {
    return prisma.patient_profiles.findUnique({ where: { id: Number(id) } });
  }

  findClinic(id) {
    return prisma.clinics.findFirst({
      where: { id: Number(id), is_active: true },
      select: { id: true, name: true, address: true },
    });
  }

  async findSchedules(query) {
    const where = {};
    if (query.service_type) where.service_type = query.service_type;
    if (query.clinic_id) where.clinic_id = query.clinic_id;
    if (typeof query.is_active === "boolean") where.is_active = query.is_active;
    if (query.from_date || query.to_date) {
      where.work_date = {};
      if (query.from_date) where.work_date.gte = parseDateOnly(query.from_date);
      if (query.to_date) where.work_date.lte = parseDateOnly(query.to_date);
    }

    const schedules = await prisma.lab_schedules.findMany({
      where,
      orderBy: [{ work_date: "asc" }, { start_time: "asc" }],
      include: scheduleInclude,
    });
    const available = query.available_only
      ? schedules.filter((item) => item.booked_orders < item.max_orders)
      : schedules;
    const start = (query.page - 1) * query.limit;
    return {
      total: available.length,
      schedules: available.slice(start, start + query.limit),
      page: query.page,
      limit: query.limit,
    };
  }

  findScheduleById(id) {
    return prisma.lab_schedules.findUnique({
      where: { id: Number(id) },
      include: {
        ...scheduleInclude,
        _count: { select: { lab_orders: true } },
      },
    });
  }

  createSchedule(data) {
    return prisma.lab_schedules.create({
      data: {
        service_type: data.service_type || "LAB",
        clinic_id: data.clinic_id,
        work_date: parseDateOnly(data.work_date),
        start_time: parseTimeOnly(data.start_time),
        end_time: parseTimeOnly(data.end_time),
        max_orders: data.max_orders,
      },
      include: scheduleInclude,
    });
  }

  updateSchedule(id, data) {
    const payload = { ...data, updated_at: new Date() };
    if (data.work_date) payload.work_date = parseDateOnly(data.work_date);
    if (data.start_time) payload.start_time = parseTimeOnly(data.start_time);
    if (data.end_time) payload.end_time = parseTimeOnly(data.end_time);
    return prisma.lab_schedules.update({
      where: { id: Number(id) },
      data: payload,
      include: scheduleInclude,
    });
  }

  deleteSchedule(id) {
    return prisma.lab_schedules.delete({ where: { id: Number(id) } });
  }

  async createOrder({
    serviceType,
    appointmentId,
    labScheduleId,
    patientId,
    doctorId,
    actorId,
    bookingCode,
    indication,
    preparationNote,
    patientNote,
    tests,
  }) {
    return prisma.$transaction(async (tx) => {
      if (labScheduleId) {
        const schedule = await tx.lab_schedules.findUnique({
          where: { id: Number(labScheduleId) },
        });
        if (
          !schedule ||
          !schedule.is_active ||
          schedule.service_type !== serviceType
        ) {
          throw Object.assign(new Error("Khung giờ dịch vụ không còn hoạt động"), {
            statusCode: 400,
          });
        }
        const duplicate = await tx.lab_orders.findFirst({
          where: {
            service_type: serviceType,
            lab_schedule_id: Number(labScheduleId),
            patient_id: Number(patientId),
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        });
        if (duplicate) {
          throw Object.assign(new Error("Hồ sơ này đã có lịch trong khung giờ đã chọn"), {
            statusCode: 409,
          });
        }
        const reserved = await tx.lab_schedules.updateMany({
          where: {
            id: Number(labScheduleId),
            is_active: true,
            booked_orders: { lt: schedule.max_orders },
          },
          data: { booked_orders: { increment: 1 } },
        });
        if (reserved.count !== 1) {
          throw Object.assign(new Error("Khung giờ dịch vụ đã hết chỗ"), {
            statusCode: 409,
          });
        }
      }

      const order = await tx.lab_orders.create({
        data: {
          service_type: serviceType,
          appointment_id: appointmentId ?? null,
          lab_schedule_id: labScheduleId ?? null,
          patient_id: patientId,
          doctor_id: doctorId ?? null,
          booking_code: bookingCode || null,
          indication: indication || null,
          preparation_note: preparationNote || null,
          patient_note: patientNote || null,
          lab_results: {
            create: tests.map((test) => ({
              test_id: test.id,
              service_name_snapshot: test.name,
              price_snapshot: test.price,
            })),
          },
          clinical_order_events: {
            create: {
              event_type: "CREATED",
              to_status: "PENDING",
              actor_id: Number(actorId),
              metadata: { service_type: serviceType },
            },
          },
        },
      });
      return tx.lab_orders.findUnique({
        where: { id: order.id },
        include: orderDetailInclude,
      });
    });
  }

  async findOrders(where, { page, limit }) {
    const skip = (page - 1) * limit;
    const [total, orders] = await prisma.$transaction([
      prisma.lab_orders.count({ where }),
      prisma.lab_orders.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ordered_at: "desc" }, { id: "desc" }],
        include: orderInclude,
      }),
    ]);
    return { total, orders, page, limit };
  }

  async getClinicalStatistics() {
    const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    const serviceTypes = ["LAB", "XRAY", "ULTRASOUND", "ENDOSCOPY", "ECG"];
    const counts = await prisma.$transaction([
      prisma.lab_orders.count(),
      ...statuses.map((status) => prisma.lab_orders.count({ where: { status } })),
      ...serviceTypes.map((service_type) =>
        prisma.lab_orders.count({ where: { service_type } }),
      ),
    ]);

    return {
      total: counts[0],
      byStatus: Object.fromEntries(
        statuses.map((status, index) => [status, counts[index + 1]]),
      ),
      byServiceType: Object.fromEntries(
        serviceTypes.map((serviceType, index) => [
          serviceType,
          counts[statuses.length + index + 1],
        ]),
      ),
    };
  }

  findOrderById(id) {
    return prisma.lab_orders.findUnique({
      where: { id: Number(id) },
      include: orderDetailInclude,
    });
  }

  findResultById(id) {
    return prisma.lab_results.findUnique({
      where: { id: Number(id) },
      include: {
        lab_tests: true,
        users: { select: userSummarySelect },
      },
    });
  }

  async updateOrderStatus(id, status, actorId, reason = null) {
    return prisma.$transaction(async (tx) => {
      const current = await findLockedOrder(tx, id);
      if (!current) throw transactionError("Không tìm thấy phiếu cận lâm sàng", 404);
      const allowedTransitions = {
        PENDING: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
      };
      if (!allowedTransitions[current.status]?.includes(status)) {
        throw transactionError("Trạng thái phiếu đã thay đổi, vui lòng tải lại");
      }
      if (status === "COMPLETED") {
        const results = await tx.lab_results.findMany({
          where: { lab_order_id: current.id },
          select: {
            result: true,
            findings: true,
            conclusion: true,
            measurements: true,
          },
        });
        if (!results.length || results.some((result) => !hasStoredResultContent(result))) {
          throw transactionError(
            "Cần nhập đầy đủ kết quả trước khi hoàn thành phiếu",
            400,
          );
        }
      }
      const now = new Date();
      const data = {};

      if (status === "IN_PROGRESS") {
        Object.assign(data, activeWorkData(current, actorId, now));
      } else if (status === "COMPLETED") {
        Object.assign(data, activeWorkData(current, actorId, now));
        data.performed_by = current.performed_by ?? Number(actorId);
        data.performed_at = current.performed_at ?? now;
        data.completed_at = now;
      } else if (status === "CANCELLED") {
        data.cancelled_at = now;
        data.cancellation_reason = reason;
        data.completed_at = null;
      }

      const updated = await tx.lab_orders.update({
        where: { id: Number(id) },
        data: { ...data, status },
      });

      await tx.clinical_order_events.create({
        data: {
          lab_order_id: current.id,
          event_type: "STATUS_CHANGED",
          from_status: current.status,
          to_status: status,
          actor_id: Number(actorId),
          reason: reason || null,
        },
      });

      if (status === "CANCELLED" && current.lab_schedule_id) {
        await tx.lab_schedules.updateMany({
          where: { id: current.lab_schedule_id, booked_orders: { gt: 0 } },
          data: { booked_orders: { decrement: 1 } },
        });
      }
      return tx.lab_orders.findUnique({
        where: { id: updated.id },
        include: orderDetailInclude,
      });
    });
  }

  async replaceLegacyResultFile(id, file, actorId) {
    return prisma.$transaction(async (tx) => {
      const current = await findLockedOrder(tx, id);
      if (!current) throw transactionError("Không tìm thấy phiếu xét nghiệm", 404);
      assertEditableOrder(current);
      await assertAttachmentQuota(
        tx,
        current.id,
        file.size,
        current.result_file_path,
      );
      const now = new Date();

      if (current.result_file_path) {
        await tx.clinical_attachments.deleteMany({
          where: {
            lab_order_id: current.id,
            storage_path: current.result_file_path,
          },
        });
      }

      await tx.clinical_attachments.create({
        data: {
          lab_order_id: current.id,
          kind: file.kind,
          original_name: file.originalName,
          storage_path: file.filename,
          mime_type: file.mimeType,
          file_size: file.size,
          uploaded_by: Number(actorId),
        },
      });

      await tx.lab_orders.update({
        where: { id: current.id },
        data: {
          result_file_name: file.originalName,
          result_file_path: file.filename,
          result_file_type: file.mimeType,
          result_file_size: file.size,
          result_uploaded_at: now,
          status: "COMPLETED",
          ...activeWorkData(current, actorId, now),
          performed_by: current.performed_by ?? Number(actorId),
          performed_at: current.performed_at ?? now,
          completed_at: now,
        },
      });

      await tx.clinical_order_events.create({
        data: {
          lab_order_id: current.id,
          event_type: "ATTACHMENT_ADDED",
          actor_id: Number(actorId),
          metadata: { storage_path: file.filename, legacy_endpoint: true },
        },
      });
      if (current.status !== "COMPLETED") {
        await tx.clinical_order_events.create({
          data: {
            lab_order_id: current.id,
            event_type: "STATUS_CHANGED",
            from_status: current.status,
            to_status: "COMPLETED",
            actor_id: Number(actorId),
            metadata: { legacy_endpoint: true },
          },
        });
      }

      return tx.lab_orders.findUnique({
        where: { id: current.id },
        include: orderDetailInclude,
      });
    });
  }

  async updateResult(orderId, resultId, data, actorId, { autoComplete = false } = {}) {
    return prisma.$transaction(async (tx) => {
      const currentOrder = await findLockedOrder(tx, orderId);
      assertEditableOrder(currentOrder);
      const existing = await tx.lab_results.findFirst({
        where: { id: Number(resultId), lab_order_id: Number(orderId) },
      });
      if (!existing) return null;
      const now = new Date();
      await tx.lab_results.update({
        where: { id: existing.id },
        data: {
          ...normalizeResultData(data),
          created_by: existing.created_by ?? Number(actorId),
          created_at: existing.created_at ?? now,
        },
      });

      const incomplete = autoComplete
        ? await tx.lab_results.count({
            where: { lab_order_id: Number(orderId), result: null },
          })
        : 1;
      const nextStatus = autoComplete && incomplete === 0
        ? "COMPLETED"
        : currentOrder.status === "PENDING"
          ? "IN_PROGRESS"
          : currentOrder.status;
      const orderData = {};

      if (nextStatus === "COMPLETED") {
        Object.assign(orderData, activeWorkData(currentOrder, actorId, now), {
          status: "COMPLETED",
          performed_by: currentOrder.performed_by ?? Number(actorId),
          performed_at: currentOrder.performed_at ?? now,
          completed_at: now,
        });
      } else if (nextStatus === "IN_PROGRESS" && currentOrder.status === "PENDING") {
        Object.assign(orderData, activeWorkData(currentOrder, actorId, now), {
          status: "IN_PROGRESS",
        });
      }

      if (Object.keys(orderData).length > 0) {
        await tx.lab_orders.update({
          where: { id: currentOrder.id },
          data: orderData,
        });
      }

      await tx.clinical_order_events.create({
        data: {
          lab_order_id: currentOrder.id,
          event_type: "RESULT_UPDATED",
          actor_id: Number(actorId),
          metadata: { result_id: existing.id, test_id: existing.test_id },
        },
      });
      if (nextStatus !== currentOrder.status) {
        await tx.clinical_order_events.create({
          data: {
            lab_order_id: currentOrder.id,
            event_type: "STATUS_CHANGED",
            from_status: currentOrder.status,
            to_status: nextStatus,
            actor_id: Number(actorId),
            metadata: { automatic: true },
          },
        });
      }

      return tx.lab_orders.findUnique({
        where: { id: Number(orderId) },
        include: orderDetailInclude,
      });
    });
  }

  async createOrUpdateResult(orderId, test, data, actorId) {
    return prisma.$transaction(async (tx) => {
      const currentOrder = await findLockedOrder(tx, orderId);
      assertEditableOrder(currentOrder);
      const existing = await tx.lab_results.findFirst({
        where: { lab_order_id: Number(orderId), test_id: Number(test.id) },
      });
      const now = new Date();
      const payload = {
        ...normalizeResultData(data),
        service_name_snapshot: existing?.service_name_snapshot || test.name,
        price_snapshot: existing?.price_snapshot ?? test.price,
        created_by: existing?.created_by ?? Number(actorId),
        created_at: existing?.created_at ?? now,
      };
      const result = existing
        ? await tx.lab_results.update({ where: { id: existing.id }, data: payload })
        : await tx.lab_results.create({
            data: {
              lab_order_id: Number(orderId),
              test_id: Number(test.id),
              ...payload,
            },
          });

      if (currentOrder.status === "PENDING") {
        await tx.lab_orders.update({
          where: { id: currentOrder.id },
          data: {
            status: "IN_PROGRESS",
            ...activeWorkData(currentOrder, actorId, now),
          },
        });
        await tx.clinical_order_events.create({
          data: {
            lab_order_id: currentOrder.id,
            event_type: "STATUS_CHANGED",
            from_status: "PENDING",
            to_status: "IN_PROGRESS",
            actor_id: Number(actorId),
            metadata: { automatic: true },
          },
        });
      }

      await tx.clinical_order_events.create({
        data: {
          lab_order_id: currentOrder.id,
          event_type: "RESULT_UPDATED",
          actor_id: Number(actorId),
          metadata: {
            result_id: result.id,
            test_id: result.test_id,
            created: !existing,
          },
        },
      });

      return tx.lab_orders.findUnique({
        where: { id: currentOrder.id },
        include: orderDetailInclude,
      });
    });
  }

  async createAttachment(orderId, file, actorId) {
    return prisma.$transaction(async (tx) => {
      const currentOrder = await findLockedOrder(tx, orderId);
      assertEditableOrder(currentOrder);
      await assertAttachmentQuota(tx, currentOrder.id, file.size);
      const attachment = await tx.clinical_attachments.create({
        data: {
          lab_order_id: currentOrder.id,
          kind: file.kind,
          original_name: file.originalName,
          storage_path: file.filename,
          mime_type: file.mimeType,
          file_size: file.size,
          uploaded_by: Number(actorId),
        },
      });

      if (currentOrder.status === "PENDING") {
        await tx.lab_orders.update({
          where: { id: currentOrder.id },
          data: {
            status: "IN_PROGRESS",
            ...activeWorkData(currentOrder, actorId),
          },
        });
        await tx.clinical_order_events.create({
          data: {
            lab_order_id: currentOrder.id,
            event_type: "STATUS_CHANGED",
            from_status: "PENDING",
            to_status: "IN_PROGRESS",
            actor_id: Number(actorId),
            metadata: { automatic: true },
          },
        });
      }

      await tx.clinical_order_events.create({
        data: {
          lab_order_id: currentOrder.id,
          event_type: "ATTACHMENT_ADDED",
          actor_id: Number(actorId),
          metadata: { attachment_id: attachment.id, kind: attachment.kind },
        },
      });

      return tx.lab_orders.findUnique({
        where: { id: currentOrder.id },
        include: orderDetailInclude,
      });
    });
  }

  findAttachmentById(id) {
    return prisma.clinical_attachments.findUnique({
      where: { id: Number(id) },
      include: {
        users: { select: userSummarySelect },
        lab_orders: { include: orderDetailInclude },
      },
    });
  }

  async deleteAttachment(id, actorId) {
    return prisma.$transaction(async (tx) => {
      const initialAttachment = await tx.clinical_attachments.findUnique({
        where: { id: Number(id) },
      });
      if (!initialAttachment) return null;

      const order = await findLockedOrder(tx, initialAttachment.lab_order_id);
      assertEditableOrder(order);
      const attachment = await tx.clinical_attachments.findUnique({
        where: { id: Number(id) },
      });
      if (!attachment) return null;
      if (order.result_file_path === attachment.storage_path) {
        await tx.lab_orders.update({
          where: { id: order.id },
          data: {
            result_file_name: null,
            result_file_path: null,
            result_file_type: null,
            result_file_size: null,
            result_uploaded_at: null,
          },
        });
      }

      await tx.clinical_order_events.create({
        data: {
          lab_order_id: attachment.lab_order_id,
          event_type: "ATTACHMENT_REMOVED",
          actor_id: Number(actorId),
          metadata: {
            attachment_id: attachment.id,
            original_name: attachment.original_name,
          },
        },
      });
      await tx.clinical_attachments.delete({ where: { id: attachment.id } });
      return attachment;
    });
  }
}

export default new LabRepository();
