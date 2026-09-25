import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const requiredColumns = {
  blood_pressure: "VARCHAR(20) NULL AFTER symptoms",
  heart_rate: "INT NULL AFTER blood_pressure",
  temperature: "DECIMAL(4,1) NULL AFTER heart_rate",
  spo2: "INT NULL AFTER temperature",
  respiratory_rate: "INT NULL AFTER spo2",
  weight: "DECIMAL(5,2) NULL AFTER respiratory_rate",
  height: "DECIMAL(5,2) NULL AFTER weight",
  clinical_examination: "TEXT NULL AFTER height",
  icd10_code: "VARCHAR(20) NULL AFTER diagnosis",
  secondary_diagnosis: "TEXT NULL AFTER icd10_code",
  assessment: "TEXT NULL AFTER secondary_diagnosis",
  follow_up_date: "DATE NULL AFTER assessment",
};

async function ensureMedicalRecordColumns() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME AS column_name
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'medical_records'
  `);

  const existingColumns = new Set(rows.map((row) => row.column_name));

  for (const [column, definition] of Object.entries(requiredColumns)) {
    if (existingColumns.has(column)) continue;
    await prisma.$executeRawUnsafe(
      `ALTER TABLE medical_records ADD COLUMN ${column} ${definition}`,
    );
    console.log(`[database] Added medical_records.${column}`);
  }

  const [legacyFollowUpColumn] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) AS total
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'prescriptions'
      AND COLUMN_NAME = 'follow_up_days'
  `);

  if (Number(legacyFollowUpColumn?.total || 0) > 0) {
    await prisma.$executeRawUnsafe(`
      UPDATE medical_records AS record_row
      INNER JOIN appointments AS appointment_row
        ON appointment_row.id = record_row.appointment_id
      INNER JOIN schedules AS schedule_row
        ON schedule_row.id = appointment_row.schedule_id
      INNER JOIN prescriptions AS prescription_row
        ON prescription_row.medical_record_id = record_row.id
      SET record_row.follow_up_date = DATE_ADD(
        schedule_row.work_date,
        INTERVAL prescription_row.follow_up_days DAY
      )
      WHERE record_row.follow_up_date IS NULL
        AND prescription_row.follow_up_days IS NOT NULL
    `);
  }

  console.log("[database] Medical record columns are ready");
}

try {
  await ensureMedicalRecordColumns();
} catch (error) {
  console.error("[database] Failed to prepare medical record columns", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
