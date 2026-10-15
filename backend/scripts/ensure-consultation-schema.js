import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${column}
  `;
  return rows.length > 0;
}

async function main() {
  if (!(await columnExists("schedules", "consultation_type"))) {
    await prisma.$executeRawUnsafe("ALTER TABLE schedules ADD COLUMN consultation_type ENUM('IN_PERSON','ONLINE') NOT NULL DEFAULT 'IN_PERSON'");
  }
  if (!(await columnExists("appointments", "consultation_type"))) {
    await prisma.$executeRawUnsafe("ALTER TABLE appointments ADD COLUMN consultation_type ENUM('IN_PERSON','ONLINE') NOT NULL DEFAULT 'IN_PERSON'");
  }
  const tables = await prisma.$queryRaw`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_sessions'
  `;
  if (!tables.length) {
    await prisma.$executeRawUnsafe(`CREATE TABLE consultation_sessions (
      id INT NOT NULL AUTO_INCREMENT,
      appointment_id INT NOT NULL,
      room_id VARCHAR(64) NOT NULL,
      status ENUM('WAITING','CONNECTING','IN_PROGRESS','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'WAITING',
      started_at DATETIME NULL,
      ended_at DATETIME NULL,
      duration_seconds INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_consultation_sessions_appointment (appointment_id),
      UNIQUE KEY uk_consultation_sessions_room (room_id),
      KEY idx_consultation_sessions_status_started (status, started_at),
      CONSTRAINT consultation_sessions_appointment_fk FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE ON UPDATE NO ACTION
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }
}

main().catch((error) => {
  console.error("Could not prepare consultation schema:", error.message);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
