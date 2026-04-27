<?php
require 'db.php';

echo "<html><body style='font-family:sans-serif;padding:20px;background:#f8fafc;'><div style='max-width:700px;margin:auto;background:white;border-radius:12px;padding:30px;box-shadow:0 4px 6px rgba(0,0,0,.1);'>";
echo "<h2>🔐 Inject Otoritas Baru</h2>";

$new_permissions = [
    ['workorder_delete', 'Dapat menghapus/menonaktifkan Work Order'],
    ['workorder_showall', 'Dapat melihat seluruh data Work Order tanpa filter tim'],
    ['installation_transfer', 'Dapat mentransfer/reassign instalasi ke user lain'],
];

try {
    $added = 0;
    $skipped = 0;
    
    foreach ($new_permissions as $perm) {
        $check = $pdo->prepare("SELECT id FROM permissions WHERE permission_name = ?");
        $check->execute([$perm[0]]);
        
        if ($check->fetch()) {
            echo "<p>ℹ️ <code>{$perm[0]}</code> sudah ada, skip.</p>";
            $skipped++;
        } else {
            $insert = $pdo->prepare("INSERT INTO permissions (permission_name, description) VALUES (?, ?)");
            $insert->execute([$perm[0], $perm[1]]);
            echo "<p>✅ Ditambahkan: <code>{$perm[0]}</code> — {$perm[1]}</p>";
            $added++;
        }
    }
    
    // Auto-assign to Admin role (role_id = 1)
    echo "<hr><h3>📌 Auto-assign ke Role Admin (ID=1)</h3>";
    $assigned = 0;
    
    foreach ($new_permissions as $perm) {
        $getPerm = $pdo->prepare("SELECT id FROM permissions WHERE permission_name = ?");
        $getPerm->execute([$perm[0]]);
        $permRow = $getPerm->fetch();
        
        if ($permRow) {
            $checkRP = $pdo->prepare("SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = ?");
            $checkRP->execute([$permRow['id']]);
            
            if (!$checkRP->fetch()) {
                $insertRP = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (1, ?)");
                $insertRP->execute([$permRow['id']]);
                echo "<p>✅ <code>{$perm[0]}</code> → Admin ✔</p>";
                $assigned++;
            } else {
                echo "<p>ℹ️ <code>{$perm[0]}</code> → Admin sudah ada.</p>";
            }
        }
    }
    
    echo "<hr>";
    echo "<h3 style='color:#059669'>📊 Summary</h3>";
    echo "<ul>";
    echo "<li>Permission ditambahkan: <b>{$added}</b></li>";
    echo "<li>Permission di-skip (sudah ada): <b>{$skipped}</b></li>";
    echo "<li>Assign ke Admin: <b>{$assigned}</b></li>";
    echo "</ul>";
    echo "<p style='color:#059669; font-weight:bold;'>✅ Selesai! Silakan <b>logout & login ulang</b> agar otoritas baru aktif.</p>";
    
} catch (Exception $e) {
    echo "<h2 style='color:#ef4444'>❌ Error</h2><pre>{$e->getMessage()}</pre>";
}
echo "</div></body></html>";
?>
