<?php
require 'db.php';

try {
    $pdo->beginTransaction();

    // 1. Insert permission if not exists
    $check = $pdo->prepare("SELECT id FROM permissions WHERE permission_name = ?");
    $check->execute(['installation_create']);
    $perm = $check->fetch(PDO::FETCH_ASSOC);

    if ($perm) {
        $permId = $perm['id'];
        echo "Permission 'installation_create' already exists (ID: {$permId}).\n";
    } else {
        $insert = $pdo->prepare("INSERT INTO permissions (permission_name, description) VALUES (?, ?)");
        $insert->execute(['installation_create', 'Dapat menambah produk instalasi baru dari halaman instalasi']);
        $permId = $pdo->lastInsertId();
        echo "Permission 'installation_create' created (ID: {$permId}).\n";
    }

    // 2. Assign to Admin role (role_id = 1) if not already
    $checkRP = $pdo->prepare("SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = ?");
    $checkRP->execute([$permId]);
    if ($checkRP->fetch()) {
        echo "Permission already assigned to Admin role.\n";
    } else {
        $insertRP = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (1, ?)");
        $insertRP->execute([$permId]);
        echo "Permission assigned to Admin role.\n";
    }

    $pdo->commit();
    echo "Done.\n";
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
