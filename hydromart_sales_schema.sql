-- Database schema for Hydromart Sales Application
-- Dialect: MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS `hydromar_sales`;
USE `hydromar_sales`;

-- --------------------------------------------------------
-- 1. AUTH MATRIX & USER ACCESS
-- --------------------------------------------------------

CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `permission_name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
);

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `role_id` INT NOT NULL,
  `status` ENUM('active', 'inactive', 'resigned') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
);

-- --------------------------------------------------------
-- [NEW] 2. USER SESSIONS (Security & Timeout)
-- --------------------------------------------------------

CREATE TABLE `user_sessions` (
  `id` VARCHAR(128) PRIMARY KEY, -- Session Token
  `user_id` INT NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 3. SYSTEM CONFIGURATION
-- --------------------------------------------------------

CREATE TABLE `app_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) NOT NULL UNIQUE,
  `config_value` TEXT,
  `description` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 4. MASTER DATA (REGIONS, PRODUCTS, CLIENTS)
-- --------------------------------------------------------

-- [NEW] Master Regions
CREATE TABLE `regions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `region_name` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `address` TEXT,
  `industry_category` VARCHAR(100),
  `region_id` INT, -- Changed from VARCHAR to FK
  `status_active` BOOLEAN DEFAULT TRUE,
  `type` ENUM('Customer', 'Prospek') DEFAULT 'Prospek',
  `assigned_sales_id` INT, 
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_sales_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE `company_pics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `job_title` VARCHAR(100),
  `phone` VARCHAR(50),
  `dob` DATE,
  `email` VARCHAR(100),
  `address` TEXT, -- [NEW] Optional address for PIC
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 5. INSTALLATIONS & PRODUCTS TRACKING
-- --------------------------------------------------------

CREATE TABLE `installations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `product_name` VARCHAR(200) NOT NULL, -- Free text per user request
  `installation_date` DATE,
  
  -- [NEW] Dynamic Replacement Cycle Generation Data
  `maintenance_cycle_value` INT, 
  `maintenance_cycle_unit` ENUM('Days', 'Months', 'Years'), 
  
  `replacement_date` DATE, -- Automatically calculated and populated by Application based on cycle limits
  `visit_schedule_date` DATE,
  `followup_date` DATE,
  `status` VARCHAR(100),
  `is_history` BOOLEAN DEFAULT FALSE,
  `assigned_to` INT, -- Direct ownership: which sales user is responsible for this WO
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 6. NOTIFICATIONS, NOTES, LOGS, AND AUDITS
-- --------------------------------------------------------

CREATE TABLE `notifications` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `related_entity_type` VARCHAR(50), -- e.g., 'installation', 'company', 'handover'
  `related_entity_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` ENUM('company', 'installation', 'pic', 'general') NOT NULL,
  `entity_id` INT NOT NULL,
  `user_id` INT NOT NULL,  
  `note_text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `handover_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_id` INT NOT NULL,
  `from_sales_id` INT,
  `to_sales_id` INT NOT NULL,
  `assigned_by` INT NOT NULL,
  `handover_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_sales_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`to_sales_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- [NEW] App-Wide CCTV / Audit Logs
CREATE TABLE `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT, -- Nullable if system job did it
  `action_type` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `table_name` VARCHAR(100) NOT NULL,
  `record_id` INT NOT NULL,   
  `old_values` JSON, 
  `new_values` JSON, 
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- INITIAL SEED DATA
-- --------------------------------------------------------

INSERT INTO `roles` (`role_name`, `description`) VALUES 
('Admin', 'Super Administrator with full access'),
('Manager', 'Manager with team view access'),
('Sales', 'Standard Sales representative');

INSERT INTO `app_configs` (`config_key`, `config_value`, `description`) VALUES
('SESSION_TIMEOUT_MINUTES', '120', 'Time in minutes before an idle user gets logged out automatically'),
('DEFAULT_REPLACEMENT_CYCLE_DAYS', '365', 'Default filter replacement cycle fallback'),
('ALLOW_SALES_REASSIGNMENT', 'true', 'Enable/disable global sales reassignment feature');
