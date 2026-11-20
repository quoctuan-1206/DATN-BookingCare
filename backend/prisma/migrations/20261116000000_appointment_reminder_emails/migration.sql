CREATE TABLE `appointment_reminder_emails` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `appointment_id` INTEGER NOT NULL,
  `reminder_key` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `last_error` TEXT NULL,
  `sent_at` DATETIME(0) NULL,
  `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `uk_appointment_reminder_email`(`appointment_id`, `reminder_key`),
  INDEX `appointment_id`(`appointment_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `appointment_reminder_emails`
  ADD CONSTRAINT `appointment_reminder_emails_ibfk_1`
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`)
  ON DELETE CASCADE ON UPDATE NO ACTION;
