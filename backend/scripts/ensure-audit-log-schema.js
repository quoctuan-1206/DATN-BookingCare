import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(64) NOT NULL,
    resource_id VARCHAR(191) NULL,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,
    metadata JSON NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE NO ACTION,
    INDEX idx_audit_logs_created_id (created_at, id),
    INDEX idx_audit_logs_user_created (user_id, created_at),
    INDEX idx_audit_logs_action_created (action, created_at),
    INDEX idx_audit_logs_resource_created (resource, created_at),
    INDEX idx_audit_logs_resource_id_created (resource_id, created_at),
    INDEX idx_audit_logs_resource_target_created (resource, resource_id, created_at)
  ) ENGINE=InnoDB COMMENT='Nhật ký thao tác bất biến của hệ thống'
`;

const REQUIRED_INDEXES = [
  ["idx_audit_logs_created_id", "INDEX idx_audit_logs_created_id (created_at, id)"],
  ["idx_audit_logs_user_created", "INDEX idx_audit_logs_user_created (user_id, created_at)"],
  ["idx_audit_logs_action_created", "INDEX idx_audit_logs_action_created (action, created_at)"],
  ["idx_audit_logs_resource_created", "INDEX idx_audit_logs_resource_created (resource, created_at)"],
  ["idx_audit_logs_resource_id_created", "INDEX idx_audit_logs_resource_id_created (resource_id, created_at)"],
  ["idx_audit_logs_resource_target_created", "INDEX idx_audit_logs_resource_target_created (resource, resource_id, created_at)"],
];

async function hasIndex(indexName) {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS total
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'audit_logs'
       AND INDEX_NAME = ?`,
    indexName,
  );
  return Number(row?.total || 0) > 0;
}

async function ensureAuditLogSchema() {
  await prisma.$executeRawUnsafe(CREATE_TABLE_SQL);

  for (const [name, definition] of REQUIRED_INDEXES) {
    if (!(await hasIndex(name))) {
      await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs ADD ${definition}`);
      console.log(`[database] Added audit_logs.${name}`);
    }
  }

  console.log("[database] Audit Log schema is ready");
}

try {
  await ensureAuditLogSchema();
} catch (error) {
  console.error("[database] Failed to prepare Audit Log schema", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
