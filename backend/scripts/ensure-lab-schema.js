import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `INSERT INTO roles (name, description)
   VALUES ('STAFF', 'Nhân viên cận lâm sàng')
   ON DUPLICATE KEY UPDATE description = VALUES(description)`,
  `CREATE TABLE IF NOT EXISTS lab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_type ENUM('LAB','XRAY','ULTRASOUND','ENDOSCOPY','ECG') NOT NULL DEFAULT 'LAB',
    booking_mode ENUM('DOCTOR_ORDER','SELF_BOOKING') NOT NULL DEFAULT 'DOCTOR_ORDER',
    name VARCHAR(255) NOT NULL,
    image VARCHAR(500) NULL,
    description TEXT NULL,
    preparation_instructions TEXT NULL,
    estimated_duration_minutes INT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lab_tests_active (is_active),
    INDEX idx_lab_tests_type_active (service_type, is_active),
    INDEX idx_lab_tests_booking_active (booking_mode, is_active)
  ) ENGINE=InnoDB COMMENT='Danh mục dịch vụ cận lâm sàng'`,
  `CREATE TABLE IF NOT EXISTS lab_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_type ENUM('LAB','XRAY','ULTRASOUND','ENDOSCOPY','ECG') NOT NULL DEFAULT 'LAB',
    clinic_id INT NOT NULL,
    work_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INT NOT NULL DEFAULT 10,
    booked_orders INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lab_schedules_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY uk_lab_schedule (clinic_id, service_type, work_date, start_time),
    INDEX idx_lab_schedules_clinic (clinic_id),
    INDEX idx_lab_schedules_type_date_active (service_type, work_date, is_active),
    INDEX idx_lab_schedules_date (work_date),
    INDEX idx_lab_schedules_active (is_active)
  ) ENGINE=InnoDB COMMENT='Khung giờ xét nghiệm theo cơ sở'`,
  `CREATE TABLE IF NOT EXISTS lab_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_type ENUM('LAB','XRAY','ULTRASOUND','ENDOSCOPY','ECG') NOT NULL DEFAULT 'LAB',
    appointment_id INT NULL,
    lab_schedule_id INT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NULL,
    accepted_by INT NULL,
    performed_by INT NULL,
    booking_code VARCHAR(50) NULL,
    indication TEXT NULL,
    preparation_note TEXT NULL,
    patient_note TEXT NULL,
    result_file_name VARCHAR(255) NULL,
    result_file_path VARCHAR(255) NULL,
    result_file_type VARCHAR(100) NULL,
    result_file_size INT NULL,
    result_uploaded_at DATETIME NULL,
    status ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    performed_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    cancellation_reason TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lab_orders_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    CONSTRAINT fk_lab_orders_schedule FOREIGN KEY (lab_schedule_id) REFERENCES lab_schedules(id) ON DELETE SET NULL,
    CONSTRAINT fk_lab_orders_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_lab_orders_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_lab_orders_accepted_by FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_lab_orders_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lab_orders_appointment (appointment_id),
    INDEX idx_lab_orders_schedule (lab_schedule_id),
    INDEX idx_lab_orders_patient (patient_id),
    INDEX idx_lab_orders_doctor (doctor_id),
    INDEX idx_lab_orders_accepted_by (accepted_by),
    INDEX idx_lab_orders_performed_by (performed_by),
    INDEX idx_lab_orders_status (status),
    INDEX idx_lab_orders_type_status_ordered (service_type, status, ordered_at),
    INDEX idx_lab_orders_patient_ordered (patient_id, ordered_at),
    INDEX idx_lab_orders_doctor_ordered (doctor_id, ordered_at),
    UNIQUE KEY uk_lab_orders_booking_code (booking_code)
  ) ENGINE=InnoDB COMMENT='Phiếu chỉ định cận lâm sàng'`,
  `CREATE TABLE IF NOT EXISTS lab_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id INT NOT NULL,
    test_id INT NOT NULL,
    service_name_snapshot VARCHAR(255) NULL,
    price_snapshot DECIMAL(10,2) NULL,
    result TEXT NULL,
    unit VARCHAR(50) NULL,
    reference_range VARCHAR(255) NULL,
    findings TEXT NULL,
    conclusion TEXT NULL,
    measurements JSON NULL,
    note TEXT NULL,
    created_by INT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lab_results_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_lab_results_test FOREIGN KEY (test_id) REFERENCES lab_tests(id),
    CONSTRAINT fk_lab_results_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_lab_order_test (lab_order_id, test_id),
    INDEX idx_lab_results_test (test_id),
    INDEX idx_lab_results_creator (created_by)
  ) ENGINE=InnoDB COMMENT='Kết quả cận lâm sàng'`,
  `CREATE TABLE IF NOT EXISTS clinical_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id INT NOT NULL,
    kind ENUM('IMAGE','DOCUMENT','VIDEO','OTHER') NOT NULL DEFAULT 'DOCUMENT',
    original_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clinical_attachments_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinical_attachments_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_clinical_attachments_storage_path (storage_path),
    INDEX idx_clinical_attachments_order_kind (lab_order_id, kind),
    INDEX idx_clinical_attachments_uploader (uploaded_by)
  ) ENGINE=InnoDB COMMENT='Tệp đính kèm cận lâm sàng'`,
  `CREATE TABLE IF NOT EXISTS clinical_order_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_order_id INT NOT NULL,
    event_type ENUM('CREATED','STATUS_CHANGED','RESULT_UPDATED','ATTACHMENT_ADDED','ATTACHMENT_REMOVED','REOPENED') NOT NULL,
    from_status ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NULL,
    to_status ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NULL,
    actor_id INT NULL,
    reason TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clinical_order_events_order FOREIGN KEY (lab_order_id) REFERENCES lab_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_clinical_order_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_clinical_order_events_order_created (lab_order_id, created_at),
    INDEX idx_clinical_order_events_actor (actor_id)
  ) ENGINE=InnoDB COMMENT='Nhật ký phiếu cận lâm sàng'`,
];

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

async function hasConstraint(table, constraintName) {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS total
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    table,
    constraintName,
  );
  return Number(row?.total || 0) > 0;
}

async function getIndexColumns(table, indexName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COLUMN_NAME AS column_name
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     ORDER BY SEQ_IN_INDEX`,
    table,
    indexName,
  );
  return rows.map((row) => row.column_name);
}

async function ensureColumn(table, column, definition) {
  if (!(await hasColumn(table, column))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function ensureIndex(table, indexName, definition) {
  if (!(await hasIndex(table, indexName))) {
    await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD ${definition}`);
  }
}

try {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  await ensureColumn(
    "lab_tests",
    "service_type",
    "ENUM('LAB','XRAY','ULTRASOUND','ENDOSCOPY','ECG') NOT NULL DEFAULT 'LAB' AFTER id",
  );
  const needsBookingModeMigration = !(await hasColumn(
    "lab_tests",
    "booking_mode",
  ));
  if (needsBookingModeMigration) {
    await ensureColumn(
      "lab_tests",
      "booking_mode",
      "ENUM('DOCTOR_ORDER','SELF_BOOKING') NOT NULL DEFAULT 'DOCTOR_ORDER' AFTER service_type",
    );
    await prisma.$executeRawUnsafe(
      "UPDATE lab_tests SET booking_mode = 'SELF_BOOKING' WHERE service_type = 'LAB'",
    );
  }
  await ensureColumn("lab_tests", "image", "VARCHAR(500) NULL AFTER name");
  await ensureColumn("lab_tests", "preparation_instructions", "TEXT NULL AFTER description");
  await ensureColumn("lab_tests", "estimated_duration_minutes", "INT NULL AFTER preparation_instructions");
  await ensureColumn(
    "lab_tests",
    "created_at",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active",
  );
  await ensureColumn(
    "lab_tests",
    "updated_at",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
  );
  await ensureIndex(
    "lab_tests",
    "idx_lab_tests_type_active",
    "INDEX idx_lab_tests_type_active (service_type, is_active)",
  );
  await ensureIndex(
    "lab_tests",
    "idx_lab_tests_booking_active",
    "INDEX idx_lab_tests_booking_active (booking_mode, is_active)",
  );

  await ensureColumn(
    "lab_schedules",
    "service_type",
    "ENUM('LAB','XRAY','ULTRASOUND','ENDOSCOPY','ECG') NOT NULL DEFAULT 'LAB' AFTER id",
  );
  await ensureIndex(
    "lab_schedules",
    "idx_lab_schedules_clinic",
    "INDEX idx_lab_schedules_clinic (clinic_id)",
  );
  if (await hasIndex("lab_schedules", "uk_lab_schedule")) {
    const columns = await getIndexColumns("lab_schedules", "uk_lab_schedule");
    if (
      columns.join(",") !==
      "clinic_id,service_type,work_date,start_time"
    ) {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE lab_schedules DROP INDEX uk_lab_schedule",
      );
    }
  }
  await ensureIndex(
    "lab_schedules",
    "uk_lab_schedule",
    "UNIQUE INDEX uk_lab_schedule (clinic_id, service_type, work_date, start_time)",
  );
  await ensureIndex(
    "lab_schedules",
    "idx_lab_schedules_type_date_active",
    "INDEX idx_lab_schedules_type_date_active (service_type, work_date, is_active)",
  );

  await prisma.$executeRawUnsafe("ALTER TABLE lab_orders MODIFY appointment_id INT NULL");
  await prisma.$executeRawUnsafe("ALTER TABLE lab_orders MODIFY doctor_id INT NULL");
  await ensureColumn(
    "lab_orders",
    "service_type",
    "ENUM('LAB','XRAY','ULTRASOUND','ENDOSCOPY','ECG') NOT NULL DEFAULT 'LAB' AFTER id",
  );
  await ensureColumn("lab_orders", "lab_schedule_id", "INT NULL AFTER appointment_id");
  await ensureColumn("lab_orders", "accepted_by", "INT NULL AFTER doctor_id");
  await ensureColumn("lab_orders", "performed_by", "INT NULL AFTER accepted_by");
  await ensureColumn("lab_orders", "booking_code", "VARCHAR(50) NULL AFTER doctor_id");
  await ensureColumn("lab_orders", "indication", "TEXT NULL AFTER booking_code");
  await ensureColumn("lab_orders", "preparation_note", "TEXT NULL AFTER indication");
  await ensureColumn("lab_orders", "patient_note", "TEXT NULL AFTER booking_code");
  await ensureColumn("lab_orders", "result_file_name", "VARCHAR(255) NULL AFTER patient_note");
  await ensureColumn("lab_orders", "result_file_path", "VARCHAR(255) NULL AFTER result_file_name");
  await ensureColumn("lab_orders", "result_file_type", "VARCHAR(100) NULL AFTER result_file_path");
  await ensureColumn("lab_orders", "result_file_size", "INT NULL AFTER result_file_type");
  await ensureColumn("lab_orders", "result_uploaded_at", "DATETIME NULL AFTER result_file_size");
  await ensureColumn("lab_orders", "started_at", "DATETIME NULL AFTER ordered_at");
  await ensureColumn("lab_orders", "performed_at", "DATETIME NULL AFTER started_at");
  await ensureColumn("lab_orders", "cancelled_at", "DATETIME NULL AFTER completed_at");
  await ensureColumn("lab_orders", "cancellation_reason", "TEXT NULL AFTER cancelled_at");
  await ensureColumn(
    "lab_orders",
    "updated_at",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER cancellation_reason",
  );
  await ensureIndex("lab_orders", "idx_lab_orders_schedule", "INDEX idx_lab_orders_schedule (lab_schedule_id)");
  await ensureIndex("lab_orders", "idx_lab_orders_accepted_by", "INDEX idx_lab_orders_accepted_by (accepted_by)");
  await ensureIndex("lab_orders", "idx_lab_orders_performed_by", "INDEX idx_lab_orders_performed_by (performed_by)");
  await ensureIndex("lab_orders", "uk_lab_orders_booking_code", "UNIQUE INDEX uk_lab_orders_booking_code (booking_code)");
  await ensureIndex(
    "lab_orders",
    "idx_lab_orders_type_status_ordered",
    "INDEX idx_lab_orders_type_status_ordered (service_type, status, ordered_at)",
  );
  await ensureIndex(
    "lab_orders",
    "idx_lab_orders_patient_ordered",
    "INDEX idx_lab_orders_patient_ordered (patient_id, ordered_at)",
  );
  await ensureIndex(
    "lab_orders",
    "idx_lab_orders_doctor_ordered",
    "INDEX idx_lab_orders_doctor_ordered (doctor_id, ordered_at)",
  );
  if (!(await hasConstraint("lab_orders", "fk_lab_orders_schedule"))) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE lab_orders ADD CONSTRAINT fk_lab_orders_schedule FOREIGN KEY (lab_schedule_id) REFERENCES lab_schedules(id) ON DELETE SET NULL",
    );
  }
  if (!(await hasConstraint("lab_orders", "fk_lab_orders_accepted_by"))) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE lab_orders ADD CONSTRAINT fk_lab_orders_accepted_by FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL",
    );
  }
  if (!(await hasConstraint("lab_orders", "fk_lab_orders_performed_by"))) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE lab_orders ADD CONSTRAINT fk_lab_orders_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL",
    );
  }

  await ensureColumn("lab_results", "service_name_snapshot", "VARCHAR(255) NULL AFTER test_id");
  await ensureColumn("lab_results", "price_snapshot", "DECIMAL(10,2) NULL AFTER service_name_snapshot");
  await ensureColumn("lab_results", "findings", "TEXT NULL AFTER reference_range");
  await ensureColumn("lab_results", "conclusion", "TEXT NULL AFTER findings");
  await ensureColumn("lab_results", "measurements", "JSON NULL AFTER conclusion");
  await ensureColumn(
    "lab_results",
    "updated_at",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
  );

  await prisma.$executeRawUnsafe(`
    UPDATE lab_results AS result_row
    INNER JOIN lab_tests AS test_row ON test_row.id = result_row.test_id
    SET
      result_row.service_name_snapshot = COALESCE(result_row.service_name_snapshot, test_row.name),
      result_row.price_snapshot = COALESCE(result_row.price_snapshot, test_row.price)
    WHERE result_row.service_name_snapshot IS NULL OR result_row.price_snapshot IS NULL
  `);

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO clinical_attachments (
      lab_order_id,
      kind,
      original_name,
      storage_path,
      mime_type,
      file_size,
      uploaded_by,
      created_at
    )
    SELECT
      order_row.id,
      CASE
        WHEN order_row.result_file_type LIKE 'image/%' THEN 'IMAGE'
        WHEN order_row.result_file_type LIKE 'video/%' THEN 'VIDEO'
        ELSE 'DOCUMENT'
      END,
      COALESCE(NULLIF(order_row.result_file_name, ''), CONCAT('legacy-result-', order_row.id)),
      order_row.result_file_path,
      COALESCE(NULLIF(order_row.result_file_type, ''), 'application/octet-stream'),
      GREATEST(COALESCE(order_row.result_file_size, 0), 0),
      NULL,
      COALESCE(order_row.result_uploaded_at, order_row.ordered_at, CURRENT_TIMESTAMP)
    FROM lab_orders AS order_row
    WHERE order_row.result_file_path IS NOT NULL
      AND order_row.result_file_path <> ''
  `);

  console.log("[database] Clinical services schema is ready (legacy lab data preserved)");
} catch (error) {
  console.error("[database] Failed to prepare clinical services schema", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
