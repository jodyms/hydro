<?php
require 'api/db.php';

try {
    // 1. Add assigned_to column
    $pdo->exec("ALTER TABLE installations ADD COLUMN IF NOT EXISTS assigned_to INT AFTER updated_by");
    
    // 2. Add FK (ignore if exists)
    try {
        $pdo->exec("ALTER TABLE installations ADD FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL");
    } catch(Exception $e) {}
    
    // 3. Backfill: set assigned_to = created_by where assigned_to is null
    $pdo->exec("UPDATE installations SET assigned_to = created_by WHERE assigned_to IS NULL AND created_by IS NOT NULL");
    
    echo "SUCCESS: assigned_to column added and backfilled.\n";
    
    // Verify
    $stmt = $pdo->query('SELECT id, company_id, assigned_to, created_by FROM installations LIMIT 5');
    $rows = $stmt->fetchAll();
    foreach($rows as $r) {
        echo "ID={$r['id']} company={$r['company_id']} assigned={$r['assigned_to']} created={$r['created_by']}\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
