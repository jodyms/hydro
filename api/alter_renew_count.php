<?php
// Migration script: Add renew_count column to installations table
require 'db.php';

try {
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM installations LIKE 'renew_count'");
    if ($stmt->rowCount() > 0) {
        echo "Column renew_count already exists.\n";
    } else {
        $pdo->exec("ALTER TABLE installations ADD COLUMN renew_count INT DEFAULT 0");
        echo "Column renew_count added successfully.\n";
    }
    exit(0);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
