import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import prisma from "../src/config/prisma.js";

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${column}
  `;
  return rows.length > 0;
}

async function indexExists(table, index) {
  const rows = await prisma.$queryRaw`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND INDEX_NAME = ${index}
  `;
  return rows.length > 0;
}

async function foreignKeyExists(table, constraint) {
  const rows = await prisma.$queryRaw`
    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND CONSTRAINT_NAME = ${constraint}
  `;
  return rows.length > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function ensureMinimumVarcharLength(table, column, minLength, definition) {
  const rows = await prisma.$queryRaw`
    SELECT CHARACTER_MAXIMUM_LENGTH AS maxLength
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
      AND COLUMN_NAME = ${column}
  `;
  const maxLength = Number(rows[0]?.maxLength);
  if (maxLength && maxLength < minLength) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`);
  }
}

async function ensureReporterReference(table, index, constraint) {
  if (!(await indexExists(table, index))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD INDEX \`${index}\` (\`reported_by\`)`);
  }
  if (!(await foreignKeyExists(table, constraint))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${constraint}\` FOREIGN KEY (\`reported_by\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }
}

async function main() {
  const migrationPath = fileURLToPath(new URL("../prisma/migrations/20261113000000_patient_health_record/migration.sql", import.meta.url));
  const sql = await readFile(migrationPath, "utf8");
  const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement.replace(/^CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS "));
  }

  // These additive checks also upgrade tables created by an earlier PHR build.
  await ensureColumn("patient_medical_history", "reported_by", "INTEGER NULL");
  await ensureReporterReference(
    "patient_medical_history",
    "idx_patient_history_reporter",
    "fk_patient_history_reporter",
  );
  await ensureColumn("patient_allergies", "source", "VARCHAR(30) NOT NULL DEFAULT 'PATIENT'");
  await ensureColumn("patient_allergies", "reported_by", "INTEGER NULL");
  await ensureMinimumVarcharLength(
    "patient_allergies",
    "confirmation_status",
    30,
    "VARCHAR(30) NOT NULL DEFAULT 'PENDING'",
  );
  await ensureReporterReference(
    "patient_allergies",
    "idx_patient_allergies_reporter",
    "fk_patient_allergies_reporter",
  );
  await ensureColumn(
    "patient_conditions",
    "confirmation_status",
    "VARCHAR(20) NOT NULL DEFAULT 'PENDING'",
  );
}

main().catch((error) => {
  console.error("Could not prepare patient health record schema:", error.message);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
