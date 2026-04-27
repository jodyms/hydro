<?php
require_once 'db.php';

try {
    // Add created_by column to relevant tables if not exists
    $tables = ['users', 'roles', 'companies', 'installations'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'created_by'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN `created_by` INT, ADD FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL");
            echo "✅ Kolom 'created_by' ditambahkan ke tabel $table\n";
        }
    }

    // Default existing records to be created by the first admin (ID 1)
    foreach ($tables as $table) {
        $pdo->exec("UPDATE `$table` SET `created_by` = 1 WHERE `created_by` IS NULL");
    }

    echo "✅ Sinkronisasi kolom pencipta selesai.";

} catch (PDOException $e) {
    die("❌ Error pada update skema: " . $e->getMessage());
}
?>
