<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'list') {
    try {
        $stmt = $pdo->prepare("SELECT r.*, u2.username as last_editor_name FROM regions r LEFT JOIN users u2 ON r.updated_by = u2.id ORDER BY status ASC, region_name ASC");
        $stmt->execute();
        $regions = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $regions]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['region_name'] ?? '';
    $user_id = $data['user_id'] ?? null;
    
    if (!$name) {
        echo json_encode(['status' => 'error', 'message' => 'Nama wilayah wajib diisi.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO regions (region_name, status, created_by) VALUES (?, 'active', ?)");
        $stmt->execute([$name, $user_id]);
        echo json_encode(['status' => 'success', 'message' => 'Region berhasil ditambahkan.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $name = $data['region_name'] ?? '';
    
    if (!$id || !$name) {
        echo json_encode(['status' => 'error', 'message' => 'ID dan Nama wajib diisi.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE regions SET region_name = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$name, $data['user_id'] ?? null, $id]);
        echo json_encode(['status' => 'success', 'message' => 'Region berhasil diperbarui.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'toggle_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id) { echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi.']); exit; }
    try {
        $stmt = $pdo->prepare("UPDATE regions SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success', 'message' => 'Status region berhasil diubah.']);
    } catch (PDOException $e) { echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
