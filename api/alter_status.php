<?php
require 'db.php';

try {
    // Add status to regions
    $pdo->exec("ALTER TABLE regions ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
    echo "Added status to regions\n";
} catch (PDOException $e) {
    echo "Error adding status to regions (maybe exists): " . $e->getMessage() . "\n";
}

try {
    // Add status to company_pics
    $pdo->exec("ALTER TABLE company_pics ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
    echo "Added status to company_pics\n";
} catch (PDOException $e) {
    echo "Error adding status to company_pics (maybe exists): " . $e->getMessage() . "\n";
}
?>
