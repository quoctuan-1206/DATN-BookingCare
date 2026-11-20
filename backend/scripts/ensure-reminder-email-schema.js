import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function tableExists(name) {
  const rows = await prisma.$queryRaw`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${name}
  `;
  return rows.length > 0;
}

async function foreignKeyExists(table, constraint) {
  const rows = await prisma.$queryRaw`
    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND CONSTRAINT_NAME = ${constraint}
  `;
  return rows.length > 0;
}

async function main() {
  if (!(await tableExists("appointment_reminder_emails"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE \`appointment_reminder_emails\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`appointment_id\` INTEGER NOT NULL,
        \`reminder_key\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        \`attempts\` INTEGER NOT NULL DEFAULT 0,
        \`last_error\` TEXT NULL,
        \`sent_at\` DATETIME(0) NULL,
        \`created_at\` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
        \`updated_at\` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
        UNIQUE INDEX \`uk_appointment_reminder_email\`(\`appointment_id\`, \`reminder_key\`),
        INDEX \`appointment_id\`(\`appointment_id\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  }
  if (!(await foreignKeyExists("appointment_reminder_emails", "appointment_reminder_emails_ibfk_1"))) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE `appointment_reminder_emails` ADD CONSTRAINT `appointment_reminder_emails_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION",
    );
  }
  console.log("[schema] appointment_reminder_emails OK");
}

main()
  .catch((error) => {
    console.error("[schema] Lỗi tạo bảng appointment_reminder_emails:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
