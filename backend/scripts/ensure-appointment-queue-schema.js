import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function columnExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'appointments'
      AND COLUMN_NAME = ${name}
  `;
  return rows.length > 0;
}

async function indexExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'appointments'
      AND INDEX_NAME = ${name}
  `;
  return rows.length > 0;
}

async function statusSupportsWorkflow() {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'appointments'
      AND COLUMN_NAME = 'status'
  `;
  const type = String(rows[0]?.COLUMN_TYPE || rows[0]?.column_type || "");
  return type.includes("CHECKED_IN") && type.includes("NO_SHOW");
}

async function ensureColumn(name, definition) {
  if (!(await columnExists(name))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE appointments ADD COLUMN \`${name}\` ${definition}`,
    );
  }
}

async function main() {
  // MySQL requires the complete enum definition when adding values.
  if (!(await statusSupportsWorkflow())) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE appointments
      MODIFY status ENUM(
        'PENDING','CONFIRMED','CHECKED_IN','WAITING','CALLED',
        'IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'
      ) NULL DEFAULT 'PENDING'
    `);
  }

  await ensureColumn("queue_number", "INT NULL AFTER exam_started_at");
  await ensureColumn("queue_key", "VARCHAR(100) NULL AFTER queue_number");
  await ensureColumn("check_in_at", "DATETIME NULL AFTER queue_key");
  await ensureColumn("called_at", "DATETIME NULL AFTER check_in_at");
  await ensureColumn("started_at", "DATETIME NULL AFTER called_at");
  await ensureColumn("completed_at", "DATETIME NULL AFTER started_at");
  await ensureColumn("no_show_at", "DATETIME NULL AFTER completed_at");

  if (!(await indexExists("idx_appointments_status"))) {
    await prisma.$executeRawUnsafe(
      "CREATE INDEX idx_appointments_status ON appointments(status)",
    );
  }
  if (!(await indexExists("idx_appointments_check_in_at"))) {
    await prisma.$executeRawUnsafe(
      "CREATE INDEX idx_appointments_check_in_at ON appointments(check_in_at)",
    );
  }
  if (!(await indexExists("uk_appointments_queue_number"))) {
    await prisma.$executeRawUnsafe(
      "CREATE UNIQUE INDEX uk_appointments_queue_number ON appointments(queue_key, queue_number)",
    );
  }
}

main()
  .then(() => console.log("Appointment queue schema is ready."))
  .finally(() => prisma.$disconnect());
