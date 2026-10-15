import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function hasColumn(table, column) {
  const [row] = await prisma.$queryRawUnsafe("SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", table, column);
  return Number(row?.total || 0) > 0;
}
async function ensureColumn(table, column, definition) {
  if (!(await hasColumn(table, column))) await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}
async function ensureInventorySchema() {
  await ensureColumn("medicines", "minimum_stock", "INTEGER NOT NULL DEFAULT 0");
  await ensureColumn("medicines", "issue_strategy", "ENUM('FIFO','FEFO') NOT NULL DEFAULT 'FEFO'");
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS inventory_batches (
    id INTEGER NOT NULL AUTO_INCREMENT, medicine_id INTEGER NOT NULL, batch_code VARCHAR(100) NOT NULL,
    received_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0), expires_at DATE NULL,
    quantity_received INTEGER NOT NULL, quantity_remaining INTEGER NOT NULL, unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(255) NULL, is_locked BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    PRIMARY KEY (id), UNIQUE INDEX uk_inventory_batch_medicine_code (medicine_id,batch_code),
    INDEX idx_inventory_batch_issue (medicine_id,expires_at,received_at),
    CONSTRAINT fk_inventory_batch_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT ON UPDATE NO ACTION
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER NOT NULL AUTO_INCREMENT, medicine_id INTEGER NOT NULL,
    kind ENUM('RECEIPT','ISSUE','ADJUSTMENT','EXPIRED','RETURN') NOT NULL, quantity INTEGER NOT NULL,
    reference_type VARCHAR(40) NULL, reference_id INTEGER NULL, note TEXT NULL, actor_id INTEGER NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0), PRIMARY KEY(id),
    INDEX idx_inventory_tx_medicine_created (medicine_id,created_at), INDEX idx_inventory_tx_reference (reference_type,reference_id),
    CONSTRAINT fk_inventory_tx_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT ON UPDATE NO ACTION
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS inventory_allocations (
    id INTEGER NOT NULL AUTO_INCREMENT, transaction_id INTEGER NOT NULL, batch_id INTEGER NOT NULL, quantity INTEGER NOT NULL,
    PRIMARY KEY(id), INDEX idx_inventory_allocation_batch (batch_id),
    CONSTRAINT fk_inventory_allocation_tx FOREIGN KEY (transaction_id) REFERENCES inventory_transactions(id) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT fk_inventory_allocation_batch FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE RESTRICT ON UPDATE NO ACTION
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log("[database] Inventory schema is ready");
}
try { await ensureInventorySchema(); }
catch (error) { console.error("[database] Failed to prepare inventory schema", error); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
