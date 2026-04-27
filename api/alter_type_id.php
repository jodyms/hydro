<?php
require 'db.php';

try {
    // Check if type column exists before dropping it later
    $stmt = $pdo->query("DESC companies");
    $cols = $stmt->fetchALL(PDO::FETCH_COLUMN);

    if (!in_array('type_id', $cols)) {
        $pdo->exec("ALTER TABLE companies ADD COLUMN type_id INT NULL");
        echo "Added type_id column to companies\n";
    }

    // Map existing 'type' string to 'type_id'
    $pdo->exec("UPDATE companies SET type_id = (SELECT id FROM company_types WHERE type_name = companies.type) WHERE type_id IS NULL");
    echo "Migrated existing company types to type_id\n";

    // Set default if any are still NULL (e.g. Prospek = 2)
    $pdo->exec("UPDATE companies SET type_id = 2 WHERE type_id IS NULL");
    echo "Set default type_id = 2 for NULLs\n";

    // Now safe to drop old 'type' column if it exists
    if (in_array('type', $cols)) {
        $pdo->exec("ALTER TABLE companies DROP COLUMN type");
        echo "Dropped old type column from companies\n";
    }

} catch (Exception $e) { echo "Error: " . $e->getMessage() . "\n"; }
?>
