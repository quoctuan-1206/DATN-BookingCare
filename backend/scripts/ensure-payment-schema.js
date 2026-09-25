import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hasColumn(table, column) {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    table,
    column,
  );
  return Number(row?.total || 0) > 0;
}

async function hasIndex(table, indexName) {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS total
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    table,
    indexName,
  );
  return Number(row?.total || 0) > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await hasColumn(table, column))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[database] Added ${table}.${column}`);
  }
}

async function ensureIndex(table, indexName, definition) {
  if (!(await hasIndex(table, indexName))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD ${definition}`);
    console.log(`[database] Added index ${table}.${indexName}`);
  }
}

async function ensurePaymentSchema() {
  await ensureColumn("invoices", "payment_expires_at", "DATETIME NULL AFTER payment_date");
  await ensureColumn("invoices", "vnp_txn_ref", "VARCHAR(100) NULL AFTER payment_expires_at");
  await ensureIndex(
    "invoices",
    "uk_invoices_vnp_txn_ref",
    "UNIQUE INDEX uk_invoices_vnp_txn_ref (vnp_txn_ref)",
  );
  await ensureIndex(
    "invoices",
    "idx_invoices_payment_expiry",
    "INDEX idx_invoices_payment_expiry (payment_status, payment_expires_at)",
  );

  console.log("[database] Payment schema is ready");
}

try {
  await ensurePaymentSchema();
} catch (error) {
  console.error("[database] Failed to prepare payment schema", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
