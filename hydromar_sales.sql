-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 26, 2026 at 06:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hydromar_sales`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_configs`
--

CREATE TABLE `app_configs` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `app_configs`
--

INSERT INTO `app_configs` (`id`, `config_key`, `config_value`, `description`, `updated_at`) VALUES
(1, 'SESSION_TIMEOUT_MINUTES', '120', 'Time in minutes before an idle user gets logged out automatically', '2026-04-05 04:13:37'),
(2, 'DEFAULT_REPLACEMENT_CYCLE_DAYS', '365', 'Default filter replacement cycle fallback', '2026-04-05 04:13:37'),
(3, 'ALLOW_SALES_REASSIGNMENT', 'true', 'Enable/disable global sales reassignment feature', '2026-04-05 04:13:37');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action_type` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` text DEFAULT NULL,
  `region_id` int(11) DEFAULT NULL,
  `status_active` tinyint(1) DEFAULT 1,
  `assigned_sales_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `industry_id` int(11) DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `address`, `region_id`, `status_active`, `assigned_sales_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `industry_id`, `type_id`) VALUES
(1, 'PT Jaya Selalu', 'Bumi', 1, 1, 1, '2026-04-05 14:51:25', '2026-04-05 15:50:29', 1, NULL, 11, 1),
(2, 'PT Jaya Abadi', 'Jaya Jaya', 2, 1, 1, '2026-04-05 15:51:03', '2026-04-05 16:01:37', 1, NULL, 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `company_pics`
--

CREATE TABLE `company_pics` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(20) DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_pics`
--

INSERT INTO `company_pics` (`id`, `company_id`, `name`, `job_title`, `phone`, `dob`, `email`, `created_at`, `updated_at`, `status`, `created_by`, `updated_by`, `address`) VALUES
(1, 1, 'Jarwo', 'Direktur', '1231231231', '2026-04-05', 'jayaabadi@ghmail.com', '2026-04-05 14:51:48', '2026-04-05 15:53:57', 'active', 1, NULL, 'test\n');

-- --------------------------------------------------------

--
-- Table structure for table `company_types`
--

CREATE TABLE `company_types` (
  `id` int(11) NOT NULL,
  `type_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_types`
--

INSERT INTO `company_types` (`id`, `type_name`) VALUES
(1, 'Customer'),
(2, 'Prospek');

-- --------------------------------------------------------

--
-- Table structure for table `handover_logs`
--

CREATE TABLE `handover_logs` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `from_sales_id` int(11) DEFAULT NULL,
  `to_sales_id` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `handover_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `handover_logs`
--

INSERT INTO `handover_logs` (`id`, `company_id`, `from_sales_id`, `to_sales_id`, `assigned_by`, `handover_reason`, `created_at`) VALUES
(1, 2, 1, 2, 1, 'Transfer via sistem', '2026-04-26 07:28:09'),
(2, 2, 2, 1, 1, 'Transfer via sistem', '2026-04-26 10:30:51'),
(3, 2, 1, 2, 1, 'test', '2026-04-26 10:31:40'),
(4, 1, 1, 2, 1, 'test', '2026-04-26 10:31:47'),
(5, 1, 2, 1, 1, 'test', '2026-04-26 10:31:54');

-- --------------------------------------------------------

--
-- Table structure for table `industries`
--

CREATE TABLE `industries` (
  `id` int(11) NOT NULL,
  `industry_name` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `industries`
--

INSERT INTO `industries` (`id`, `industry_name`, `created_by`) VALUES
(1, 'Manufaktur', NULL),
(2, 'F&B', NULL),
(3, 'Water Treatment', NULL),
(4, 'Pertambangan', NULL),
(5, 'Lainnya', NULL),
(11, 'Otomotif', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `installations`
--

CREATE TABLE `installations` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `installation_date` date DEFAULT NULL,
  `maintenance_cycle_value` int(11) DEFAULT NULL,
  `maintenance_cycle_unit` enum('Days','Months','Years') DEFAULT NULL,
  `replacement_date` date DEFAULT NULL,
  `visit_schedule_date` date DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_history` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `status_active` tinyint(1) DEFAULT 1,
  `assigned_to` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `installations`
--

INSERT INTO `installations` (`id`, `company_id`, `product_name`, `installation_date`, `maintenance_cycle_value`, `maintenance_cycle_unit`, `replacement_date`, `visit_schedule_date`, `status`, `notes`, `is_history`, `created_at`, `updated_at`, `created_by`, `updated_by`, `status_active`, `assigned_to`) VALUES
(1, 2, 'test', '2026-04-01', 3, 'Days', '2026-04-04', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-11 13:28:23', '2026-04-26 10:31:40', 1, 1, 1, 2),
(2, 2, 'test', '2026-04-01', 30, 'Days', '2026-05-01', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-11 13:28:23', '2026-04-26 10:31:40', 1, 1, 1, 2),
(3, 2, 'test', '2026-04-02', 1, 'Days', '2026-04-03', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-13 15:31:51', '2026-04-26 10:31:40', 1, 1, 1, 2),
(4, 1, 'testt4est', '2026-04-18', 15, 'Days', '2026-05-03', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-18 13:49:59', '2026-04-26 10:31:54', 1, 1, 1, 1),
(5, 2, 'test', '2026-04-18', 1, 'Days', '2026-07-01', NULL, 'Scheduled', NULL, 0, '2026-04-18 14:04:31', '2026-04-26 10:31:40', 1, 1, 1, 2),
(6, 2, 'test', '2026-04-18', 3, 'Days', '2026-04-07', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-18 14:09:49', '2026-04-26 10:31:40', 1, 1, 1, 2),
(7, 2, 'test', '2026-04-18', 30, 'Days', '2026-05-31', NULL, 'Scheduled', NULL, 0, '2026-04-18 14:10:28', '2026-04-26 10:31:40', 1, 1, 1, 2),
(8, 2, 'test', '2026-04-18', 3, 'Days', '2026-05-18', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-18 14:14:44', '2026-04-26 10:31:40', 1, 1, 1, 2),
(9, 2, 'test', '2026-04-18', 3, 'Days', '2026-05-18', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru | Catatan: pergantian filter karena sudah waktu nya di ganti', 1, '2026-04-18 14:16:39', '2026-04-26 10:31:40', 1, 1, 1, 2),
(10, 1, 'testt4est', '2026-04-18', 15, 'Days', '2026-06-01', NULL, 'Scheduled', NULL, 0, '2026-04-18 14:17:03', '2026-04-26 10:31:54', 1, 1, 1, 1),
(11, 2, 'test', '2026-04-18', 3, 'Days', '2026-05-18', NULL, 'Scheduled', NULL, 0, '2026-04-18 14:17:38', '2026-04-26 10:31:40', 1, 1, 1, 2),
(12, 1, 'jkljkl', '2026-04-03', 1, 'Years', '2027-04-03', NULL, 'Scheduled', NULL, 0, '2026-04-18 15:52:09', '2026-04-26 10:31:54', 2, 1, 1, 1),
(13, 2, 'Filter ', '2026-04-01', 1, 'Years', '2027-04-01', NULL, 'Scheduled', NULL, 0, '2026-04-18 15:54:28', '2026-04-26 10:31:40', 2, 1, 1, 2),
(14, 2, 'testtest', '2026-04-01', 1, 'Years', '2027-04-01', NULL, 'Scheduled', NULL, 0, '2026-04-19 04:05:51', '2026-04-26 10:31:40', 1, 1, 1, 2),
(15, 2, 'filter', '2026-04-08', 1, 'Years', '2027-04-08', NULL, 'Scheduled', NULL, 0, '2026-04-19 04:05:51', '2026-04-26 10:31:40', 1, 1, 1, 2),
(16, 2, 'test', '2026-04-26', 3, 'Days', '2026-04-26', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-26 05:55:22', '2026-04-26 10:31:40', 1, 1, 1, 2),
(17, 2, 'test', '2026-04-26', 3, 'Days', '2026-04-29', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru', 1, '2026-04-26 05:55:50', '2026-04-26 10:31:40', 1, 1, 1, 2),
(18, 2, 'test', '2026-04-26', 3, 'Days', '2026-04-29', NULL, 'Done', 'Lengkap & Diperpanjang ke siklus baru | Catatan: perpanjang', 1, '2026-04-26 06:26:21', '2026-04-26 10:31:40', 1, 1, 1, 2),
(19, 2, 'test', '2026-04-30', 3, 'Days', '2026-05-03', NULL, 'Offering Product', 'Perpanjangan: perpanjang', 0, '2026-04-26 07:19:45', '2026-04-26 10:31:40', 1, 1, 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `installation_activity_logs`
--

CREATE TABLE `installation_activity_logs` (
  `id` bigint(20) NOT NULL,
  `installation_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `installation_activity_logs`
--

INSERT INTO `installation_activity_logs` (`id`, `installation_id`, `company_id`, `action_type`, `description`, `old_values`, `new_values`, `user_id`, `created_at`) VALUES
(1, 18, 2, 'RENEW', 'Produk diperpanjang: test → test', '{\"product_name\":\"test\",\"replacement_date\":\"2026-04-29\",\"status\":\"Offering Product\"}', '{\"product_name\":\"test\",\"replacement_date\":\"2026-05-03\",\"new_id\":\"19\",\"notes\":\"perpanjang\"}', 1, '2026-04-26 07:19:45'),
(2, 19, 2, 'EDIT', 'Data diperbarui (Bulk): test', '{\"product_name\":\"test\",\"status\":\"Scheduled\",\"replacement_date\":\"2026-05-03\"}', '{\"id\":19,\"company_id\":2,\"product_name\":\"test\",\"installation_date\":\"2026-04-30\",\"maintenance_cycle_value\":3,\"maintenance_cycle_unit\":\"Days\",\"replacement_date\":\"2026-05-03\",\"visit_schedule_date\":null,\"status\":\"Offering Product\",\"notes\":\"Perpanjangan: perpanjang\",\"is_history\":0,\"created_at\":\"2026-04-26 14:19:45\",\"updated_at\":\"2026-04-26 14:28:09\",\"created_by\":1,\"updated_by\":1,\"status_active\":1,\"assigned_to\":2,\"company_name\":\"PT Jaya Abadi\",\"company_type\":\"Prospek\",\"region\":\"Bandung\",\"creator_name\":\"Admin\",\"last_editor_name\":\"Admin\",\"assigned_to_name\":\"Sales\"}', 2, '2026-04-26 07:30:30');

-- --------------------------------------------------------

--
-- Table structure for table `installation_statuses`
--

CREATE TABLE `installation_statuses` (
  `id` int(11) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  `color` varchar(20) DEFAULT '#64748b',
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `installation_statuses`
--

INSERT INTO `installation_statuses` (`id`, `status_name`, `color`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'Reminder Sent', '#3b82f6', 1, 1, '2026-04-26 06:28:25'),
(2, 'Offering Product', '#8b5cf6', 2, 1, '2026-04-26 06:28:25'),
(3, 'Scheduled for Replacement', '#f59e0b', 3, 1, '2026-04-26 06:28:25'),
(4, 'Done', '#10b981', 4, 1, '2026-04-26 06:28:25'),
(5, 'Skip', '#ef4444', 5, 1, '2026-04-26 06:28:25'),
(6, 'Follow up', '#0ea5e9', 6, 1, '2026-04-26 06:28:25');

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` int(11) NOT NULL,
  `entity_type` enum('company','installation','pic','general') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `note_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `related_entity_type` varchar(50) DEFAULT NULL,
  `related_entity_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `permission_name`, `description`, `created_at`) VALUES
(1, 'user_create', 'Dapat mendaftarkan atau menambahkan Sales/User baru', '2026-04-05 05:02:11'),
(2, 'user_read', 'Dapat mengakses dan melihat menu Master User', '2026-04-05 05:02:11'),
(3, 'user_update', 'Dapat mengedit data dan status dari User', '2026-04-05 05:02:11'),
(4, 'user_delete', 'Dapat menghapus Akun User dari sistem secara permanen', '2026-04-05 05:02:11'),
(5, 'user_showall', 'Dapat melihat seluruh daftar User tanpa terpengaruh filter limitasi', '2026-04-05 05:02:11'),
(11, 'role_create', 'Dapat menambah Role baru', '2026-04-05 05:16:25'),
(12, 'role_read', 'Dapat mengakses dan melihat menu Master Role', '2026-04-05 05:16:25'),
(13, 'role_update', 'Dapat mengedit data Role', '2026-04-05 05:16:25'),
(14, 'role_delete', 'Dapat menonaktifkan (soft delete) Role', '2026-04-05 05:16:25'),
(15, 'role_set_authority', 'Dapat mengatur matriks otoritas per Role', '2026-04-05 05:16:25'),
(16, 'dashboard_read', 'Dapat mengakses Dashboard utama', '2026-04-05 05:16:25'),
(17, 'sales_create', 'Dapat menambah data instalasi baru', '2026-04-05 05:16:25'),
(18, 'sales_read', 'Dapat melihat menu Instalasi Baru', '2026-04-05 05:16:25'),
(19, 'sales_update', 'Dapat mengedit data instalasi', '2026-04-05 05:16:25'),
(20, 'sales_delete', 'Dapat menghapus data instalasi', '2026-04-05 05:16:25'),
(21, 'sales_showall', 'Dapat melihat seluruh data instalasi', '2026-04-05 05:16:25'),
(22, 'prospecting_read', 'Dapat mengakses menu Smart Prospecting', '2026-04-05 05:16:25'),
(23, 'workorder_create', 'Dapat membuat Work Order baru', '2026-04-05 05:16:25'),
(24, 'workorder_read', 'Dapat melihat menu Work Order', '2026-04-05 05:16:25'),
(25, 'workorder_update', 'Dapat mengedit Work Order', '2026-04-05 05:16:25'),
(26, 'company_create', 'Dapat menambah data Company baru', '2026-04-05 05:16:25'),
(27, 'company_read', 'Dapat melihat menu Data Company', '2026-04-05 05:16:25'),
(28, 'company_update', 'Dapat mengedit data Company', '2026-04-05 05:16:25'),
(29, 'company_delete', 'Dapat menghapus data Company', '2026-04-05 05:16:25'),
(30, 'company_showall', 'Dapat melihat seluruh data Company', '2026-04-05 05:16:25'),
(31, 'pic_create', 'Dapat menambah data PIC baru', '2026-04-05 05:16:25'),
(32, 'pic_read', 'Dapat melihat menu Data PIC', '2026-04-05 05:16:25'),
(33, 'pic_update', 'Dapat mengedit data PIC', '2026-04-05 05:16:25'),
(34, 'pic_delete', 'Dapat menghapus data PIC', '2026-04-05 05:16:25'),
(35, 'history_read', 'Dapat melihat menu History / Arsip', '2026-04-05 05:16:25'),
(36, 'team_read', 'Membuka halaman Master Team', '2026-04-05 06:09:19'),
(37, 'team_create', 'Menambah Tim baru', '2026-04-05 06:09:19'),
(38, 'team_update', 'Mengubah data Tim dan Anggotanya', '2026-04-05 06:09:19'),
(39, 'team_delete', 'Menonaktifkan Tim', '2026-04-05 06:09:19'),
(40, 'team_showall', 'Melihat seluruh data Tim lintas pencipta', '2026-04-05 06:09:19'),
(41, 'dashboard_showall', 'Melihat ringkasan seluruh data di Dashboard', '2026-04-05 06:09:19'),
(43, 'role_showall', 'Melihat seluruh data Role lintas pencipta', '2026-04-05 06:09:19'),
(45, 'prospecting_showall', 'Melihat seluruh data Prospecting lintas pencipta', '2026-04-05 06:09:19'),
(46, 'workorder_showall', 'Melihat seluruh data Work Order lintas pencipta', '2026-04-05 06:09:19'),
(48, 'pic_showall', 'Melihat seluruh data PIC lintas pencipta', '2026-04-05 06:09:19'),
(49, 'history_showall', 'Melihat seluruh data History lintas pencipta', '2026-04-05 06:09:19'),
(50, 'region_read', 'Melihat daftar region', '2026-04-05 11:26:53'),
(51, 'region_create', 'Menambah region baru', '2026-04-05 11:26:53'),
(52, 'region_update', 'Mengubah data region', '2026-04-05 11:26:53'),
(53, 'region_delete', 'Menghapus region (jika tidak digunakan)', '2026-04-05 11:26:53'),
(75, 'workorder_delete', 'Dapat menghapus/menonaktifkan Work Order', '2026-04-18 16:20:48'),
(77, 'installation_transfer', 'Dapat mentransfer/reassign instalasi ke user lain', '2026-04-18 16:20:48'),
(88, 'prospecting_assign', 'Assign tasks to agents in Smart Prospecting', '2026-04-26 04:16:01'),
(89, 'installation_read', NULL, '2026-04-26 11:08:13'),
(90, 'installation_update', NULL, '2026-04-26 11:08:13'),
(91, 'installation_delete', NULL, '2026-04-26 11:08:13'),
(92, 'installation_showall', NULL, '2026-04-26 11:08:13'),
(93, 'all_access', NULL, '2026-04-26 11:08:14');

-- --------------------------------------------------------

--
-- Table structure for table `regions`
--

CREATE TABLE `regions` (
  `id` int(11) NOT NULL,
  `region_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(20) DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `regions`
--

INSERT INTO `regions` (`id`, `region_name`, `created_at`, `updated_at`, `status`, `created_by`, `updated_by`) VALUES
(1, 'Jakarta', '2026-04-05 14:50:51', '2026-04-05 15:48:37', 'active', 1, NULL),
(2, 'Bandung', '2026-04-05 15:50:40', '2026-04-13 15:31:33', 'active', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('active','inactive') DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `description`, `created_at`, `updated_at`, `status`, `created_by`, `updated_by`) VALUES
(1, 'Admin', 'Super Administrator with full access', '2026-04-05 04:13:37', '2026-04-05 06:10:28', 'active', 1, NULL),
(2, 'Manager', 'Manager with team view access', '2026-04-05 04:13:37', '2026-04-05 06:10:28', 'active', 1, NULL),
(3, 'Sales', 'Standard Sales representative', '2026-04-05 04:13:37', '2026-04-05 06:10:28', 'active', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(1, 40),
(1, 41),
(1, 43),
(1, 45),
(1, 46),
(1, 48),
(1, 49),
(1, 50),
(1, 51),
(1, 52),
(1, 53),
(1, 75),
(1, 77),
(1, 88),
(1, 89),
(1, 90),
(1, 91),
(1, 92),
(1, 93),
(2, 16),
(2, 17),
(2, 18),
(2, 19),
(2, 20),
(2, 21),
(2, 23),
(2, 24),
(2, 25),
(2, 46),
(3, 16),
(3, 17),
(3, 18),
(3, 19),
(3, 20),
(3, 23),
(3, 24),
(3, 25);

-- --------------------------------------------------------

--
-- Table structure for table `statuses`
--

CREATE TABLE `statuses` (
  `id` int(11) NOT NULL,
  `status_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `statuses`
--

INSERT INTO `statuses` (`id`, `status_name`) VALUES
(4, 'Done'),
(6, 'Follow up'),
(2, 'Offering Product'),
(1, 'Reminder Sent'),
(3, 'Scheduled for Replacement'),
(5, 'Skip');

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `team_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (`id`, `team_name`, `description`, `created_by`, `updated_by`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Hydromart', '', 1, 1, 'active', '2026-04-05 06:41:25', '2026-04-13 15:31:15');

-- --------------------------------------------------------

--
-- Table structure for table `team_members`
--

CREATE TABLE `team_members` (
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_members`
--

INSERT INTO `team_members` (`team_id`, `user_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role_id` int(11) NOT NULL,
  `status` enum('active','inactive','resigned') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `phone` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `email`, `role_id`, `status`, `created_at`, `updated_at`, `phone`, `created_by`, `updated_by`) VALUES
(1, 'Admin', '$2y$10$bG9Rb/tkV9d9FdBipNkLme979GW3AE7wgTX./tNJm7RmGAmAgwagm', 'admin@huiwater.local', 1, 'active', '2026-04-05 04:57:04', '2026-04-05 06:10:28', '081288835835', 1, NULL),
(2, 'Sales', '$2y$10$eTbVZdVMRrpxGG2yeApRx.lqeScYSLK1MCld/7.Hv2lGOFcmn/.i2', 'Sales@sales.com', 3, 'active', '2026-04-05 05:13:01', '2026-04-05 16:07:56', '0812345678', 1, 1),
(3, 'manager', '$2y$10$DRWX61Vt9Kk.PDcxXgiJjOapdX4/hpRf0LbSMsjDkZFvcpIhzbknm', 'manager@manager', 2, 'active', '2026-04-05 06:03:22', '2026-04-05 16:07:52', '1231312312', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_activity_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `last_activity_at`, `expires_at`, `created_at`) VALUES
('0a6b304241615ed8e93c4503bc229ccd08969895fe669fb026d989d74dd59551', 1, NULL, NULL, '2026-04-05 06:32:52', '2026-04-05 10:32:52', '2026-04-05 06:32:52'),
('0b376f8268e5196427fcddd60b675820e9aba6ff5b36a9f1f010ab8210aa5958', 1, NULL, NULL, '2026-04-18 15:48:18', '2026-04-18 19:48:18', '2026-04-18 15:48:18'),
('0c81d7c547e3cb7c1b034556744186006c341217362acdbd02d5599306b5116c', 1, NULL, NULL, '2026-04-05 05:51:06', '2026-04-05 09:51:06', '2026-04-05 05:51:06'),
('0e4630e4cfd22aafc504c4c95f0aa1761bbe81c21ff2d4d05321062ccebde5f1', 2, NULL, NULL, '2026-04-26 10:32:01', '2026-04-26 14:32:01', '2026-04-26 10:32:01'),
('112331c30dee1536ab26a04d9b2b9107e72ca3ee7bc43539d79b779e597ec085', 1, NULL, NULL, '2026-04-05 11:18:47', '2026-04-05 15:18:47', '2026-04-05 11:18:47'),
('154ce575f6471e94714e80fd762c33893dc44ac5bd3ded38fc585322f771aaa0', 1, NULL, NULL, '2026-04-18 15:43:42', '2026-04-18 19:43:42', '2026-04-18 15:43:42'),
('2b42213b05b93904182a0b929bf8bc6ce849eb337b7247ec09cb4f5887af95cd', 1, NULL, NULL, '2026-04-18 16:38:05', '2026-04-18 20:38:05', '2026-04-18 16:38:05'),
('2d32d40486156b43c94b2e2ca4bafc5ee8934a8c18d747170a3de858c8c2d1a7', 2, NULL, NULL, '2026-04-05 06:03:57', '2026-04-05 10:03:57', '2026-04-05 06:03:57'),
('2ed3e967465c1c8c412b47001a8a2e674efae66943421448efb226ea1035946f', 2, NULL, NULL, '2026-04-05 06:32:40', '2026-04-05 10:32:40', '2026-04-05 06:32:40'),
('4f7a8f42c21e1891d488afab10fea137d9ad011ca221a377dd739a656a9f8179', 1, NULL, NULL, '2026-04-18 15:43:43', '2026-04-18 19:43:43', '2026-04-18 15:43:43'),
('5937710c0fcba1ffefd5e9912cc080d7ce1956bc04f3f109270eddfe4d326eeb', 1, NULL, NULL, '2026-04-26 10:31:29', '2026-04-26 14:31:29', '2026-04-26 10:31:29'),
('7d66663164e66b58675a636da5621c3e0a9843961cd1d78bcc840889edc7cd34', 1, NULL, NULL, '2026-04-05 06:04:13', '2026-04-05 10:04:13', '2026-04-05 06:04:13'),
('7ec6cfa8e44a062ad426d1d47bb9c8df80d0cac12c9026d8210a504c71b47c1d', 1, NULL, NULL, '2026-04-05 05:53:45', '2026-04-05 09:53:45', '2026-04-05 05:53:45'),
('82856ebbf52717a3878eda56f8969790be2da6b2adc462a07513f52ad9dec000', 2, NULL, NULL, '2026-04-26 07:29:28', '2026-04-26 11:29:28', '2026-04-26 07:29:28'),
('8355fd50a304f576d18f0beb83c9be0b6ea65e2c02f4ddeccb58b794641d6088', 1, NULL, NULL, '2026-04-18 13:36:51', '2026-04-18 17:36:51', '2026-04-18 13:36:51'),
('8e284dda8b440e3a73c0835614dfd060b38b46186e061c104f8cad86eadd3fe5', 1, NULL, NULL, '2026-04-05 06:30:42', '2026-04-05 10:30:42', '2026-04-05 06:30:42'),
('914a957a06fc8d3d7669c3ace4aeadfed9898b1c1f00304fb76f943b79804501', 2, NULL, NULL, '2026-04-26 10:31:12', '2026-04-26 14:31:12', '2026-04-26 10:31:12'),
('93a44b7ce7100d6eed88d95009ac0016df51757cfb7e22c1baca85337304a8f9', 1, NULL, NULL, '2026-04-05 14:04:09', '2026-04-05 18:04:09', '2026-04-05 14:04:09'),
('9d266eab9ff84134fd152512e887117a3e9c79c9a289dbe51254bedb74df5bb5', 1, NULL, NULL, '2026-04-05 04:57:42', '2026-04-05 08:57:42', '2026-04-05 04:57:42'),
('b0936cbfdf04a7178a5c84ec6ffce9db94c29b70e66a8e7ba3f72160d5f3f6c6', 1, NULL, NULL, '2026-04-26 10:33:04', '2026-04-26 14:33:04', '2026-04-26 10:33:04'),
('ba01828dcd69a80c09e458f856090f28a3bc253e9967c434662c7f94475455fc', 1, NULL, NULL, '2026-04-18 16:06:09', '2026-04-18 20:06:09', '2026-04-18 16:06:09'),
('bbc22755d6be474c8d16a6c3bf6a5f247755bad1145a72a652e08704465b785f', 1, NULL, NULL, '2026-04-11 13:16:23', '2026-04-11 17:16:23', '2026-04-11 13:16:23'),
('bf5284331acea22f938ff29ff2caff40fa3f87615225792340221f9174228bc0', 2, NULL, NULL, '2026-04-18 15:50:56', '2026-04-18 19:50:56', '2026-04-18 15:50:56'),
('c4dd20420d976f299cbe11cd6aa39f3171d4e5054fc1c1aec2d3c4ae24d27bed', 1, NULL, NULL, '2026-04-05 05:55:35', '2026-04-05 09:55:35', '2026-04-05 05:55:35'),
('cac36fd3a54a12b9d41b580294549b35b037bf3b4979163a1b92d8b4e59daa4b', 1, NULL, NULL, '2026-04-18 15:47:32', '2026-04-18 19:47:32', '2026-04-18 15:47:32'),
('cc3f4129dd75059ada3de39f58b53ee454ae73d5b40b45c0622455194a4985ef', 1, NULL, NULL, '2026-04-18 14:06:56', '2026-04-18 18:06:56', '2026-04-18 14:06:56'),
('ceb025d316e9846b5a94598b07fa7bfcdb8cf54bc7d83cc5747a68a997445664', 1, NULL, NULL, '2026-04-26 07:47:33', '2026-04-26 11:47:33', '2026-04-26 07:47:33'),
('d2bbcc889e29b614d019a0fc65799755dc8aab342d422a4ab0213876accef443', 1, NULL, NULL, '2026-04-18 13:47:48', '2026-04-18 17:47:48', '2026-04-18 13:47:48'),
('e5a605cfa2c20ef08477fa26b745eefbbe3378d72aa26720356658a5546aa48f', 3, NULL, NULL, '2026-04-05 06:04:07', '2026-04-05 10:04:07', '2026-04-05 06:04:07'),
('f880740b1ee001ce96f7c8998d429ac6584b7fc27dfb045eafb1a4956f45cdc7', 2, NULL, NULL, '2026-04-18 15:47:40', '2026-04-18 19:47:40', '2026-04-18 15:47:40');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_configs`
--
ALTER TABLE `app_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `region_id` (`region_id`),
  ADD KEY `assigned_sales_id` (`assigned_sales_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `industry_id` (`industry_id`);

--
-- Indexes for table `company_pics`
--
ALTER TABLE `company_pics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `company_types`
--
ALTER TABLE `company_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `type_name` (`type_name`);

--
-- Indexes for table `handover_logs`
--
ALTER TABLE `handover_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `from_sales_id` (`from_sales_id`),
  ADD KEY `to_sales_id` (`to_sales_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `industries`
--
ALTER TABLE `industries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `industry_name` (`industry_name`);

--
-- Indexes for table `installations`
--
ALTER TABLE `installations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `assigned_to` (`assigned_to`);

--
-- Indexes for table `installation_activity_logs`
--
ALTER TABLE `installation_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company` (`company_id`),
  ADD KEY `idx_installation` (`installation_id`);

--
-- Indexes for table `installation_statuses`
--
ALTER TABLE `installation_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_name` (`status_name`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_name` (`permission_name`);

--
-- Indexes for table `regions`
--
ALTER TABLE `regions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `region_name` (`region_name`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `status_name` (`status_name`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `team_name` (`team_name`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`team_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app_configs`
--
ALTER TABLE `app_configs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `company_pics`
--
ALTER TABLE `company_pics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `company_types`
--
ALTER TABLE `company_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `handover_logs`
--
ALTER TABLE `handover_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `industries`
--
ALTER TABLE `industries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `installations`
--
ALTER TABLE `installations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `installation_activity_logs`
--
ALTER TABLE `installation_activity_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `installation_statuses`
--
ALTER TABLE `installation_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `regions`
--
ALTER TABLE `regions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `statuses`
--
ALTER TABLE `statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `companies_ibfk_2` FOREIGN KEY (`assigned_sales_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `companies_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `companies_ibfk_4` FOREIGN KEY (`industry_id`) REFERENCES `industries` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `company_pics`
--
ALTER TABLE `company_pics`
  ADD CONSTRAINT `company_pics_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `handover_logs`
--
ALTER TABLE `handover_logs`
  ADD CONSTRAINT `handover_logs_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `handover_logs_ibfk_2` FOREIGN KEY (`from_sales_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `handover_logs_ibfk_3` FOREIGN KEY (`to_sales_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `handover_logs_ibfk_4` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `installations`
--
ALTER TABLE `installations`
  ADD CONSTRAINT `installations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `installations_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `installations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `installations_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `installations_ibfk_5` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `team_members`
--
ALTER TABLE `team_members`
  ADD CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
