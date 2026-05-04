<?php
require 'db.php';

echo "<html><body style='font-family:sans-serif;padding:20px;background:#f8fafc;'><div style='max-width:700px;margin:auto;background:white;border-radius:12px;padding:30px;box-shadow:0 4px 6px rgba(0,0,0,.1);'>";

try {
    $pdo->beginTransaction();

    // Complete list of permissions for ALL menus
    $perms = [
        // Master User
        ['user_create', 'Dapat mendaftarkan atau menambahkan User baru'],
        ['user_read', 'Dapat mengakses dan melihat menu Master User'],
        ['user_update', 'Dapat mengedit data dan status dari User'],
        ['user_delete', 'Dapat menonaktifkan (soft delete) User dari sistem'],
        ['user_showall', 'Dapat melihat seluruh User tanpa filter limitasi'],
        // Master Role
        ['role_create', 'Dapat menambah Role baru'],
        ['role_read', 'Dapat mengakses dan melihat menu Master Role'],
        ['role_update', 'Dapat mengedit data Role'],
        ['role_delete', 'Dapat menonaktifkan (soft delete) Role'],
        ['role_set_authority', 'Dapat mengatur matriks otoritas per Role'],
        // Dashboard
        ['dashboard_read', 'Dapat mengakses Dashboard utama'],
        // Sales / Instalasi
        ['sales_create', 'Dapat menambah data instalasi baru'],
        ['sales_read', 'Dapat melihat menu Instalasi Baru'],
        ['sales_update', 'Dapat mengedit data instalasi'],
        ['sales_delete', 'Dapat menghapus data instalasi'],
        ['sales_showall', 'Dapat melihat seluruh data instalasi'],
        ['installation_create', 'Dapat menambah produk instalasi baru dari halaman instalasi'],
        // Prospecting
        ['prospecting_read', 'Dapat mengakses menu Smart Prospecting'],
        // Work Order
        ['workorder_create', 'Dapat membuat Work Order baru'],
        ['workorder_read', 'Dapat melihat menu Work Order'],
        ['workorder_update', 'Dapat mengedit Work Order'],
        ['workorder_delete', 'Dapat menghapus/menonaktifkan Work Order'],
        ['workorder_showall', 'Dapat melihat seluruh data Work Order tanpa filter tim'],
        ['installation_transfer', 'Dapat mentransfer/reassign instalasi ke user lain'],
        // Company
        ['company_create', 'Dapat menambah data Company baru'],
        ['company_read', 'Dapat melihat menu Data Company'],
        ['company_update', 'Dapat mengedit data Company'],
        ['company_delete', 'Dapat menghapus data Company'],
        ['company_showall', 'Dapat melihat seluruh data Company'],
        // PIC
        ['pic_create', 'Dapat menambah data PIC baru'],
        ['pic_read', 'Dapat melihat menu Data PIC'],
        ['pic_update', 'Dapat mengedit data PIC'],
        ['pic_delete', 'Dapat menghapus data PIC'],
        // History
        ['history_read', 'Dapat melihat menu History / Arsip'],
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO permissions (permission_name, description) VALUES (?, ?)");
    echo "<h3>📋 Injeksi Permissions Lengkap Semua Menu</h3><ul>";
    foreach ($perms as $p) {
        $stmt->execute($p);
        echo "<li>✅ {$p[0]}</li>";
    }
    echo "</ul>";

    // Assign ALL permissions to Admin (Role ID 1)
    $allPerms = $pdo->query("SELECT id FROM permissions")->fetchAll(PDO::FETCH_COLUMN);
    $stmtRP = $pdo->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, ?)");
    echo "<h3>🔑 Mengikat Semua ke Super Admin (Role 1)</h3><ul>";
    foreach ($allPerms as $pid) {
        $stmtRP->execute([$pid]);
        echo "<li>Permisi #{$pid} ✅</li>";
    }
    echo "</ul>";

    // Add status column to roles if not exists
    try {
        $pdo->exec("ALTER TABLE roles ADD COLUMN status ENUM('active','inactive') DEFAULT 'active'");
        echo "<p>✅ Kolom <b>status</b> berhasil ditambahkan ke tabel <b>roles</b>.</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p>ℹ️ Kolom status di roles sudah ada.</p>";
        }
    }

    $pdo->commit();
    echo "<h2 style='color:#059669'>💎 Semua Permissions Siap!</h2>";
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo "<h2 style='color:#ef4444'>❌ Error</h2><pre>{$e->getMessage()}</pre>";
}
echo "</div></body></html>";
?>
