<?php
require 'db.php';

// 1. Create installation_statuses table
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `installation_statuses` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `status_name` VARCHAR(100) NOT NULL UNIQUE,
        `color` VARCHAR(20) DEFAULT '#64748b',
        `sort_order` INT DEFAULT 0,
        `is_active` BOOLEAN DEFAULT TRUE,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Table installation_statuses created.\n";

    // Seed default statuses
    $statuses = [
        ['Reminder Sent', '#3b82f6', 1],
        ['Offering Product', '#8b5cf6', 2],
        ['Scheduled for Replacement', '#f59e0b', 3],
        ['Done', '#10b981', 4],
        ['Skip', '#ef4444', 5],
        ['Follow up', '#0ea5e9', 6]
    ];
    $stmt = $pdo->prepare("INSERT IGNORE INTO installation_statuses (status_name, color, sort_order) VALUES (?, ?, ?)");
    foreach ($statuses as $s) {
        $stmt->execute($s);
    }
    echo "Statuses seeded.\n";
} catch (PDOException $e) {
    echo "Status table error: " . $e->getMessage() . "\n";
}

// 2. Create installation_activity_logs table
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `installation_activity_logs` (
        `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
        `installation_id` INT NOT NULL,
        `company_id` INT NOT NULL,
        `action_type` VARCHAR(50) NOT NULL,
        `description` TEXT,
        `old_values` JSON,
        `new_values` JSON,
        `user_id` INT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company (company_id),
        INDEX idx_installation (installation_id)
    )");
    echo "Table installation_activity_logs created.\n";
} catch (PDOException $e) {
    echo "Activity logs table error: " . $e->getMessage() . "\n";
}

echo "\nDone!\n";
?>
