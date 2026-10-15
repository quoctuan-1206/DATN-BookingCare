ALTER TABLE `schedules`
  ADD COLUMN `consultation_type` ENUM('IN_PERSON', 'ONLINE') NOT NULL DEFAULT 'IN_PERSON';

ALTER TABLE `appointments`
  ADD COLUMN `consultation_type` ENUM('IN_PERSON', 'ONLINE') NOT NULL DEFAULT 'IN_PERSON';

CREATE TABLE `consultation_sessions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `appointment_id` INTEGER NOT NULL,
  `room_id` VARCHAR(64) NOT NULL,
  `status` ENUM('WAITING', 'CONNECTING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
  `started_at` DATETIME(0) NULL,
  `ended_at` DATETIME(0) NULL,
  `duration_seconds` INTEGER NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  INDEX `idx_consultation_sessions_status_started` (`status`, `started_at`),
  UNIQUE INDEX `uk_consultation_sessions_appointment` (`appointment_id`),
  UNIQUE INDEX `uk_consultation_sessions_room` (`room_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `consultation_sessions_appointment_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;
