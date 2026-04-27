<?php
require_once 'db.php';

try {
    // 1. Create Teams Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `teams` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `team_name` VARCHAR(100) NOT NULL UNIQUE,
        `description` TEXT,
        `created_by` INT,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 2. Create Team Members Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `team_members` (
        `team_id` INT NOT NULL,
        `user_id` INT NOT NULL,
        PRIMARY KEY (`team_id`, `user_id`),
        FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 3. Update Permissions Matrix
    $new_permissions = [
        ['team_read', 'Membuka halaman Master Team'],
        ['team_create', 'Menambah Tim baru'],
        ['team_update', 'Mengubah data Tim dan Anggotanya'],
        ['team_delete', 'Menonaktifkan Tim'],
        ['team_showall', 'Melihat seluruh data Tim lintas pencipta'],
        
        // Show All Global Permissions
        ['dashboard_showall', 'Melihat ringkasan seluruh data di Dashboard'],
        ['user_showall', 'Melihat seluruh data User lintas pencipta'],
        ['role_showall', 'Melihat seluruh data Role lintas pencipta'],
        ['sales_showall', 'Melihat seluruh data Instalasi lintas pencipta'],
        ['prospecting_showall', 'Melihat seluruh data Prospecting lintas pencipta'],
        ['workorder_showall', 'Melihat seluruh data Work Order lintas pencipta'],
        ['company_showall', 'Melihat seluruh data Company lintas pencipta'],
        ['pic_showall', 'Melihat seluruh data PIC lintas pencipta'],
        ['history_showall', 'Melihat seluruh data History lintas pencipta']
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO permissions (permission_name, description) VALUES (?, ?)");
    foreach ($new_permissions as $p) {
        $stmt->execute($p);
    }

    // 4. Grant all new permissions to Admin Role (Role ID 1)
    // Find permission IDs
    $perm_names = array_map(fn($p) => $p[0], $new_permissions);
    $placeholders = str_repeat('?,', count($perm_names) - 1) . '?';
    $stmt = $pdo->prepare("SELECT id FROM permissions WHERE permission_name IN ($placeholders)");
    $stmt->execute($perm_names);
    $perm_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $grant_stmt = $pdo->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, ?)");
    foreach ($perm_ids as $pid) {
        $grant_stmt->execute([$pid]);
    }

    echo "✅ Database teams berhasil disiapkan dan otoritas admin diperbarui.";

} catch (PDOException $e) {
    die("❌ Error pada migrasi database: " . $e->getMessage());
}
?>
