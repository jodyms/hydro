<?php
require 'db.php';

echo "<html><body style='font-family:sans-serif;padding:20px;background:#f8fafc;'><div style='max-width:700px;margin:auto;background:white;border-radius:12px;padding:30px;box-shadow:0 4px 6px rgba(0,0,0,.1);'>";
echo "<h2>🔧 Migrasi: Tambah kolom assigned_to di installations</h2>";

try {
    // 1. Add assigned_to column
    try {
        $pdo->exec("ALTER TABLE installations ADD COLUMN assigned_to INT DEFAULT NULL");
        $pdo->exec("ALTER TABLE installations ADD FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL");
        echo "<p>✅ Kolom <b>assigned_to</b> berhasil ditambahkan ke tabel <b>installations</b>.</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p>ℹ️ Kolom assigned_to sudah ada.</p>";
        } else {
            throw $e;
        }
    }

    // 2. Migrate existing data: set assigned_to = created_by for records that don't have it yet
    $stmt = $pdo->prepare("UPDATE installations SET assigned_to = created_by WHERE assigned_to IS NULL AND created_by IS NOT NULL");
    $stmt->execute();
    $affected = $stmt->rowCount();
    echo "<p>✅ Migrasi data: <b>{$affected}</b> record di-update (assigned_to = created_by).</p>";

    // 3. Also try to fill from company's assigned_sales_id where created_by was null
    $stmt2 = $pdo->prepare("UPDATE installations i 
                             JOIN companies c ON i.company_id = c.id 
                             SET i.assigned_to = c.assigned_sales_id 
                             WHERE i.assigned_to IS NULL AND c.assigned_sales_id IS NOT NULL");
    $stmt2->execute();
    $affected2 = $stmt2->rowCount();
    echo "<p>✅ Migrasi dari company: <b>{$affected2}</b> record di-update (assigned_to dari company.assigned_sales_id).</p>";

    // Show summary
    $total = $pdo->query("SELECT COUNT(*) FROM installations")->fetchColumn();
    $filled = $pdo->query("SELECT COUNT(*) FROM installations WHERE assigned_to IS NOT NULL")->fetchColumn();
    $empty = $pdo->query("SELECT COUNT(*) FROM installations WHERE assigned_to IS NULL")->fetchColumn();
    
    echo "<h3>📊 Summary</h3>";
    echo "<ul>";
    echo "<li>Total installations: <b>{$total}</b></li>";
    echo "<li>Sudah punya assigned_to: <b>{$filled}</b></li>";
    echo "<li>Belum punya assigned_to: <b>{$empty}</b></li>";
    echo "</ul>";
    
    echo "<h2 style='color:#059669'>✅ Migrasi Selesai!</h2>";
} catch (Exception $e) {
    echo "<h2 style='color:#ef4444'>❌ Error</h2><pre>{$e->getMessage()}</pre>";
}
echo "</div></body></html>";
?>
