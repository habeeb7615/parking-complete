-- Create subscription_history table
-- Run this SQL script if you want to create the table manually without restarting the server
-- Note: This table does NOT have foreign key constraints to avoid constraint errors

USE apitest;

CREATE TABLE IF NOT EXISTS `subscription_history` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `contractor_id` VARCHAR(36) NOT NULL,
  `subscription_plan_id` VARCHAR(36) NULL,
  `subscription_start_date` TIMESTAMP NULL,
  `subscription_end_date` TIMESTAMP NULL,
  `subscription_status` VARCHAR(255) NULL,
  `action` VARCHAR(255) NULL,
  `action_performed_by` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_contractor_id` (`contractor_id`),
  INDEX `idx_subscription_plan_id` (`subscription_plan_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

