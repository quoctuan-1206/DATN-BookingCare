import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const requiredColumns = {
  specialties_content:
    "ALTER TABLE `clinics` ADD COLUMN `specialties_content` TEXT NULL AFTER `description`",
  equipment_content:
    "ALTER TABLE `clinics` ADD COLUMN `equipment_content` TEXT NULL AFTER `specialties_content`",
};

async function ensureClinicContentColumns() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME AS column_name
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clinics'
      AND COLUMN_NAME IN ('specialties_content', 'equipment_content')
  `);

  const existingColumns = new Set(rows.map((row) => row.column_name));

  for (const [column, statement] of Object.entries(requiredColumns)) {
    if (existingColumns.has(column)) continue;
    await prisma.$executeRawUnsafe(statement);
    console.log(`[database] Added clinics.${column}`);
  }

  console.log("[database] Clinic content columns are ready");
}

try {
  await ensureClinicContentColumns();
} catch (error) {
  console.error("[database] Failed to prepare clinic content columns", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
