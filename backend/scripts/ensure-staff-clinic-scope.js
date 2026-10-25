import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hasColumn(table, column) {
  const [row] = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    table,
    column,
  );
  return Number(row?.total || 0) > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await hasColumn(table, column))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`,
    );
  }
}

async function hasForeignKey(table, name) {
  const [row] = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) AS total FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
    table,
    name,
  );
  return Number(row?.total || 0) > 0;
}

async function ensureForeignKey(table, name, sql) {
  if (!(await hasForeignKey(table, name))) await prisma.$executeRawUnsafe(sql);
}

async function ensureStaffClinicScope() {
  await ensureColumn("users", "clinic_id", "INTEGER NULL");
  await ensureColumn("lab_orders", "clinic_id", "INTEGER NULL");
  await ensureColumn("inventory_batches", "clinic_id", "INTEGER NULL");
  await ensureColumn("inventory_transactions", "clinic_id", "INTEGER NULL");

  const indexes = [
    ["users", "idx_users_clinic", "CREATE INDEX idx_users_clinic ON users(clinic_id)"],
    ["lab_orders", "idx_lab_orders_clinic_status_ordered", "CREATE INDEX idx_lab_orders_clinic_status_ordered ON lab_orders(clinic_id, service_type, status, ordered_at)"],
    ["inventory_batches", "idx_inventory_batches_clinic_medicine", "CREATE INDEX idx_inventory_batches_clinic_medicine ON inventory_batches(clinic_id, medicine_id)"],
    ["inventory_transactions", "idx_inventory_transactions_clinic_created", "CREATE INDEX idx_inventory_transactions_clinic_created ON inventory_transactions(clinic_id, created_at)"],
  ];
  for (const [table, name, sql] of indexes) {
    const [row] = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
      table,
      name,
    );
    if (!Number(row?.total || 0)) await prisma.$executeRawUnsafe(sql);
  }

  await ensureForeignKey(
    "users",
    "fk_users_clinic",
    "ALTER TABLE users ADD CONSTRAINT fk_users_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL ON UPDATE NO ACTION",
  );
  await ensureForeignKey(
    "lab_orders",
    "fk_lab_orders_clinic",
    "ALTER TABLE lab_orders ADD CONSTRAINT fk_lab_orders_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT ON UPDATE NO ACTION",
  );
  await ensureForeignKey(
    "inventory_batches",
    "fk_inventory_batches_clinic",
    "ALTER TABLE inventory_batches ADD CONSTRAINT fk_inventory_batches_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT ON UPDATE NO ACTION",
  );
  await ensureForeignKey(
    "inventory_transactions",
    "fk_inventory_transactions_clinic",
    "ALTER TABLE inventory_transactions ADD CONSTRAINT fk_inventory_transactions_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE RESTRICT ON UPDATE NO ACTION",
  );

  await prisma.$executeRawUnsafe(
    "UPDATE lab_orders o JOIN lab_schedules s ON s.id = o.lab_schedule_id SET o.clinic_id = s.clinic_id WHERE o.clinic_id IS NULL",
  );
  await prisma.$executeRawUnsafe(
    "UPDATE lab_orders o JOIN appointments a ON a.id = o.appointment_id JOIN schedules s ON s.id = a.schedule_id JOIN doctor_workplaces w ON w.id = s.doctor_workplace_id SET o.clinic_id = w.clinic_id WHERE o.clinic_id IS NULL",
  );
  await prisma.$executeRawUnsafe(
    "UPDATE inventory_transactions t JOIN (SELECT a.transaction_id, MIN(b.clinic_id) AS clinic_id, COUNT(DISTINCT b.clinic_id) AS clinic_count FROM inventory_allocations a JOIN inventory_batches b ON b.id = a.batch_id WHERE b.clinic_id IS NOT NULL GROUP BY a.transaction_id) x ON x.transaction_id = t.id SET t.clinic_id = x.clinic_id WHERE t.clinic_id IS NULL AND x.clinic_count = 1",
  );

  const [clinicCount] = await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) AS total FROM clinics",
  );
  if (Number(clinicCount?.total || 0) === 1) {
    const [clinic] = await prisma.$queryRawUnsafe(
      "SELECT id FROM clinics LIMIT 1",
    );
    await prisma.$executeRawUnsafe(
      "UPDATE inventory_batches SET clinic_id = ? WHERE clinic_id IS NULL",
      clinic.id,
    );
    await prisma.$executeRawUnsafe(
      "UPDATE inventory_transactions SET clinic_id = ? WHERE clinic_id IS NULL",
      clinic.id,
    );
    await prisma.$executeRawUnsafe(
      "UPDATE lab_orders SET clinic_id = ? WHERE clinic_id IS NULL AND lab_schedule_id IS NULL",
      clinic.id,
    );
  }

  console.log("[database] STAFF clinic scope schema is ready");
}

try {
  await ensureStaffClinicScope();
} catch (error) {
  console.error("[database] Failed to prepare STAFF clinic scope", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
