<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'list') {
    try {
        $stmt = $pdo->query("SELECT * FROM installation_statuses WHERE is_active = 1 ORDER BY sort_order ASC");
        $data = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['status_name'] ?? null;
    $color = $data['color'] ?? '#64748b';
    
    if (!$name) {
        echo json_encode(['status' => 'error', 'message' => 'Nama status wajib diisi.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO installation_statuses (status_name, color, sort_order) VALUES (?, ?, (SELECT IFNULL(MAX(s.sort_order),0)+1 FROM installation_statuses s))");
        $stmt->execute([$name, $color]);
        echo json_encode(['status' => 'success', 'message' => 'Status berhasil ditambahkan.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
