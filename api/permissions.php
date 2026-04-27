<?php
require 'db.php';

// Returns an array of permission_name strings for a given role_id
$role_id = $_GET['role_id'] ?? null;

if (!$role_id) {
    echo json_encode(['status' => 'error', 'message' => 'role_id is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT p.permission_name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?");
    $stmt->execute([$role_id]);
    $perms = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['status' => 'success', 'permissions' => $perms]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
