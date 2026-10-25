import prisma from "../config/prisma.js";
import { clinicIdForUser, getStaffClinicId } from "../utils/facility-scope.js";

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function scopedClinic(user, requestedClinicId, { required = false } = {}) {
  const clinicId = clinicIdForUser(user, requestedClinicId);
  if (required && !clinicId) fail("Vui lòng chọn cơ sở cho thao tác tồn kho", 400);
  return clinicId;
}

function clinicWhere(clinicId) {
  return clinicId ? { clinic_id: clinicId } : {};
}

class InventoryService {
  async availability(medicineId, currentUser = null) {
    const clinicId = getStaffClinicId(currentUser);
    const now = new Date();
    const batches = await prisma.inventory_batches.findMany({
      where: {
        medicine_id: Number(medicineId),
        ...clinicWhere(clinicId),
        is_locked: false,
        quantity_remaining: { gt: 0 },
        OR: [{ expires_at: null }, { expires_at: { gte: now } }],
      },
      select: { quantity_remaining: true },
    });
    return batches.reduce((sum, batch) => sum + batch.quantity_remaining, 0);
  }

  async summary(currentUser, requestedClinicId) {
    const clinicId = scopedClinic(currentUser, requestedClinicId);
    const inventoryWhere = clinicWhere(clinicId);
    const [medicines, batches, recent, clinic] = await Promise.all([
      prisma.medicines.findMany({
        include: { inventory_batches: { where: inventoryWhere } },
        orderBy: { name: "asc" },
      }),
      prisma.inventory_batches.findMany({
        where: { ...inventoryWhere, quantity_remaining: { gt: 0 } },
        include: { medicines: true, clinics: { select: { id: true, name: true } } },
        orderBy: { expires_at: "asc" },
        take: 500,
      }),
      prisma.inventory_transactions.findMany({
        where: inventoryWhere,
        include: {
          medicines: true,
          clinics: { select: { id: true, name: true } },
          allocations: { include: { inventory_batches: true } },
        },
        orderBy: { created_at: "desc" },
        take: 10,
      }),
      clinicId
        ? prisma.clinics.findUnique({ where: { id: clinicId }, select: { id: true, name: true } })
        : Promise.resolve(null),
    ]);
    const now = new Date();
    const edge = new Date(now);
    edge.setDate(edge.getDate() + 90);
    const rows = medicines.map((medicine) => ({
      id: medicine.id,
      name: medicine.name,
      unit: medicine.unit,
      minimum_stock: medicine.minimum_stock,
      issue_strategy: medicine.issue_strategy,
      stock: medicine.inventory_batches.reduce(
        (sum, batch) => sum + batch.quantity_remaining,
        0,
      ),
    }));
    return {
      clinic_id: clinicId ?? null,
      clinic_name: clinic?.name ?? null,
      totals: {
        items: rows.length,
        units: rows.reduce((sum, medicine) => sum + medicine.stock, 0),
        low_stock: rows.filter((medicine) => medicine.stock <= medicine.minimum_stock).length,
        expiring: batches.filter((batch) => batch.expires_at && new Date(batch.expires_at) <= edge && new Date(batch.expires_at) >= now).length,
        expired: batches.filter((batch) => batch.expires_at && new Date(batch.expires_at) < now).length,
      },
      medicines: rows,
      batches,
      transactions: recent,
    };
  }

  async listBatches({ search, page = 1, limit = 50, onlyAlerts = false, clinic_id }, currentUser) {
    const clinicId = scopedClinic(currentUser, clinic_id);
    const where = {
      ...clinicWhere(clinicId),
      ...(search
        ? { OR: [{ batch_code: { contains: search } }, { medicines: { name: { contains: search } } }] }
        : {}),
    };
    const all = await prisma.inventory_batches.findMany({
      where,
      include: { medicines: true, clinics: { select: { id: true, name: true } } },
      orderBy: [{ expires_at: "asc" }, { received_at: "asc" }],
    });
    const now = new Date();
    const edge = new Date(now);
    edge.setDate(edge.getDate() + 90);
    const filtered = onlyAlerts
      ? all.filter((batch) => batch.quantity_remaining > 0 && (batch.quantity_remaining <= batch.medicines.minimum_stock || (batch.expires_at && new Date(batch.expires_at) <= edge)))
      : all;
    return { total: filtered.length, page, limit, data: filtered.slice((page - 1) * limit, page * limit) };
  }

  async listTransactions({ search, page = 1, limit = 50, kind, clinic_id }, currentUser) {
    const clinicId = scopedClinic(currentUser, clinic_id);
    const where = {
      ...clinicWhere(clinicId),
      ...(kind ? { kind } : {}),
      ...(search ? { medicines: { name: { contains: search } } } : {}),
    };
    const [total, data] = await prisma.$transaction([
      prisma.inventory_transactions.count({ where }),
      prisma.inventory_transactions.findMany({
        where,
        include: {
          medicines: true,
          clinics: { select: { id: true, name: true } },
          allocations: { include: { inventory_batches: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { total, page, limit, data };
  }

  async receive(input, actorId, currentUser) {
    const clinicId = scopedClinic(currentUser, input.clinic_id, { required: true });
    return prisma.$transaction(async (tx) => {
      const medicine = await tx.medicines.findUnique({ where: { id: input.medicine_id } });
      if (!medicine) fail("Không tìm thấy mặt hàng", 404);
      const batch = await tx.inventory_batches.create({
        data: {
          clinic_id: clinicId,
          medicine_id: input.medicine_id,
          batch_code: input.batch_code,
          quantity_received: input.quantity,
          quantity_remaining: input.quantity,
          expires_at: input.expires_at || null,
          unit_cost: input.unit_cost,
          supplier: input.supplier || null,
        },
      });
      const transaction = await tx.inventory_transactions.create({
        data: {
          clinic_id: clinicId,
          medicine_id: input.medicine_id,
          kind: "RECEIPT",
          quantity: input.quantity,
          note: input.note || null,
          actor_id: actorId,
          allocations: { create: { batch_id: batch.id, quantity: input.quantity } },
        },
      });
      return { batch, transaction };
    });
  }

  async issue(input, actorId, currentUser) {
    const clinicId = scopedClinic(currentUser, input.clinic_id, { required: true });
    return prisma.$transaction(async (tx) => {
      const medicine = await tx.medicines.findUnique({ where: { id: input.medicine_id } });
      if (!medicine) fail("Không tìm thấy mặt hàng", 404);
      const candidates = (input.strategy || medicine.issue_strategy) === "FIFO"
        ? await tx.$queryRaw`
        SELECT id, quantity_remaining, expires_at, is_locked
        FROM inventory_batches
        WHERE medicine_id = ${input.medicine_id}
          AND clinic_id = ${clinicId}
          AND quantity_remaining > 0
          AND is_locked = 0
          AND (expires_at IS NULL OR expires_at >= CURRENT_DATE())
        ORDER BY received_at ASC, id ASC FOR UPDATE`
        : await tx.$queryRaw`
        SELECT id, quantity_remaining, expires_at, is_locked
        FROM inventory_batches
        WHERE medicine_id = ${input.medicine_id}
          AND clinic_id = ${clinicId}
          AND quantity_remaining > 0
          AND is_locked = 0
          AND (expires_at IS NULL OR expires_at >= CURRENT_DATE())
        ORDER BY expires_at IS NULL, expires_at ASC, received_at ASC, id ASC FOR UPDATE`;
      const available = candidates.reduce((sum, batch) => sum + Number(batch.quantity_remaining), 0);
      if (available < input.quantity) fail(`Không đủ tồn khả dụng (còn ${available})`, 409);
      let remaining = input.quantity;
      const allocations = [];
      for (const batch of candidates) {
        if (!remaining) break;
        const take = Math.min(remaining, Number(batch.quantity_remaining));
        const result = await tx.inventory_batches.updateMany({
          where: { id: Number(batch.id), clinic_id: clinicId, quantity_remaining: { gte: take }, is_locked: false },
          data: { quantity_remaining: { decrement: take } },
        });
        if (result.count !== 1) fail("Tồn kho vừa thay đổi, vui lòng thử lại", 409);
        allocations.push({ batch_id: Number(batch.id), quantity: take });
        remaining -= take;
      }
      return tx.inventory_transactions.create({
        data: {
          clinic_id: clinicId,
          medicine_id: input.medicine_id,
          kind: "ISSUE",
          quantity: input.quantity,
          reference_type: input.reference_type || null,
          reference_id: input.reference_id || null,
          note: input.note || null,
          actor_id: actorId,
          allocations: { create: allocations },
        },
      });
    }, { isolationLevel: "Serializable" });
  }

  async adjust(input, actorId, currentUser) {
    const clinicId = scopedClinic(currentUser, input.clinic_id);
    return prisma.$transaction(async (tx) => {
      const batch = await tx.inventory_batches.findFirst({
        where: { id: input.batch_id, ...clinicWhere(clinicId) },
      });
      if (!batch) fail("Không tìm thấy lô tại cơ sở này", 404);
      const next = batch.quantity_remaining + input.quantity;
      if (next < 0) fail("Điều chỉnh không thể làm tồn âm");
      const updated = await tx.inventory_batches.updateMany({
        where: { id: batch.id, clinic_id: batch.clinic_id, quantity_remaining: batch.quantity_remaining },
        data: { quantity_remaining: next },
      });
      if (updated.count !== 1) fail("Lô vừa thay đổi, hãy tải lại", 409);
      const transaction = await tx.inventory_transactions.create({
        data: {
          clinic_id: batch.clinic_id,
          medicine_id: batch.medicine_id,
          kind: "ADJUSTMENT",
          quantity: input.quantity,
          note: input.note,
          actor_id: actorId,
          allocations: { create: { batch_id: batch.id, quantity: Math.abs(input.quantity) } },
        },
      });
      return { batch: { ...batch, quantity_remaining: next }, transaction };
    }, { isolationLevel: "Serializable" });
  }

  async processExpired(actorId, currentUser, requestedClinicId) {
    const clinicId = scopedClinic(currentUser, requestedClinicId);
    return prisma.$transaction(async (tx) => {
      const expired = clinicId
        ? await tx.$queryRaw`SELECT id, medicine_id, clinic_id, quantity_remaining FROM inventory_batches WHERE clinic_id = ${clinicId} AND quantity_remaining > 0 AND expires_at < CURRENT_DATE() FOR UPDATE`
        : await tx.$queryRaw`SELECT id, medicine_id, clinic_id, quantity_remaining FROM inventory_batches WHERE quantity_remaining > 0 AND expires_at < CURRENT_DATE() FOR UPDATE`;
      const processed = [];
      for (const batch of expired) {
        const quantity = Number(batch.quantity_remaining);
        const result = await tx.inventory_batches.updateMany({
          where: { id: Number(batch.id), clinic_id: batch.clinic_id, quantity_remaining: quantity },
          data: { quantity_remaining: 0, is_locked: true },
        });
        if (result.count !== 1) fail("Lô hàng vừa thay đổi, hãy thử lại", 409);
        processed.push(await tx.inventory_transactions.create({
          data: {
            clinic_id: batch.clinic_id,
            medicine_id: Number(batch.medicine_id),
            kind: "EXPIRED",
            quantity,
            note: "Hủy tồn lô hết hạn",
            actor_id: actorId,
            allocations: { create: { batch_id: Number(batch.id), quantity } },
          },
        }));
      }
      return { count: processed.length, transactions: processed };
    }, { isolationLevel: "Serializable" });
  }
}

export default new InventoryService();
