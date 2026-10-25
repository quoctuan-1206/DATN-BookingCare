import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hasColumn(column) {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lab_orders' AND COLUMN_NAME = ?`,
    column,
  );
  return Number(row?.total || 0) > 0;
}

async function hasIndex(name) {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS total FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lab_orders' AND INDEX_NAME = ?`,
    name,
  );
  return Number(row?.total || 0) > 0;
}

async function ensureColumn(name, definition) {
  if (!(await hasColumn(name))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE lab_orders ADD COLUMN ${name} ${definition}`);
    console.log(`[database] Added lab_orders.${name}`);
  }
}

try {
  await ensureColumn("payment_amount", "DECIMAL(10,2) NULL AFTER status");
  await ensureColumn("payment_method", "ENUM('CASH','VNPAY','MOMO','BANK_TRANSFER') NULL AFTER payment_amount");
  await ensureColumn("payment_status", "ENUM('UNPAID','PAID','REFUNDED') NULL AFTER payment_method");
  await ensureColumn("payment_date", "DATETIME NULL AFTER payment_status");
  await ensureColumn("payment_expires_at", "DATETIME NULL AFTER payment_date");
  await ensureColumn("vnp_txn_ref", "VARCHAR(100) NULL AFTER payment_expires_at");
  await ensureColumn("transaction_id", "VARCHAR(100) NULL AFTER vnp_txn_ref");
  if (!(await hasIndex("uk_lab_orders_vnp_txn_ref"))) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE lab_orders ADD UNIQUE INDEX uk_lab_orders_vnp_txn_ref (vnp_txn_ref)",
    );
  }
  if (!(await hasIndex("idx_lab_orders_payment_expiry"))) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE lab_orders ADD INDEX idx_lab_orders_payment_expiry (payment_status, payment_expires_at)",
    );
  }
  console.log("[database] Clinical payment schema is ready");
} catch (error) {
  console.error("[database] Failed to prepare clinical payment schema", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
