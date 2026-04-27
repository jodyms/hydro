<?php
require 'api/db.php';

try {
    // 1. Add audit columns to installations table
    $pdo->exec("ALTER TABLE installations 
                ADD COLUMN IF NOT EXISTS notes TEXT AFTER status,
                ADD COLUMN IF NOT EXISTS created_by INT AFTER updated_at,
                ADD COLUMN IF NOT EXISTS updated_by INT AFTER created_by;");
    
    // 2. Add foreign keys if they don't exist
    // Attempting to add foreign keys (might fail if already exists, so we catch)
    try {
        $pdo->exec("ALTER TABLE installations ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;");
    } catch(Exception $e) {}
    
    try {
        $pdo->exec("ALTER TABLE installations ADD FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;");
    } catch(Exception $e) {}

    echo "Table 'installations' updated successfully with audit fields.\n";
} catch (PDOException $e) {
    echo "Error updating table: " . $e->getMessage() . "\n";
}
?>
