<?php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    $show_all = isset($_GET['show_all']) ? ($_GET['show_all'] === 'true') : true;

    try {
        if ($show_all || !$user_id) {
            $stmt = $pdo->query("SELECT u.id, u.username, u.email, u.phone, u.status, u.role_id, r.role_name, c.username as creator_name, u2.username as last_editor_name 
                                 FROM users u 
                                 JOIN roles r ON u.role_id = r.id 
                                 LEFT JOIN users c ON u.created_by = c.id
                                 LEFT JOIN users u2 ON u.updated_by = u2.id
                                 ORDER BY u.id DESC");
        } else {
            // Logic: Show users who share at least one team with the requesting user
            $stmt = $pdo->prepare("SELECT DISTINCT u.id, u.username, u.email, u.phone, u.status, u.role_id, r.role_name, c.username as creator_name, u2.username as last_editor_name 
                                 FROM users u 
                                 JOIN roles r ON u.role_id = r.id 
                                 LEFT JOIN users c ON u.created_by = c.id
                                 LEFT JOIN users u2 ON u.updated_by = u2.id
                                 JOIN team_members tm1 ON u.id = tm1.user_id
                                 JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                                 WHERE tm2.user_id = ?
                                 ORDER BY u.id DESC");
            $stmt->execute([$user_id]);
        }
        $users = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data pengguna: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $role_id = $data['role_id'] ?? null;
    $status = $data['status'] ?? 'active';
    $phone = $data['phone'] ?? null;
    
    if (!$id || !$role_id) {
        echo json_encode(['status' => 'error', 'message' => 'ID dan Role ID tidak boleh kosong.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET role_id = ?, status = ?, phone = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$role_id, $status, $phone, $data['user_id'] ?? null, $id]);
        echo json_encode(['status' => 'success', 'message' => 'Data User berhasil diubah.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah User: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'deactivate') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID User wajib.']);
        exit;
    }
    try {
        $pdo->prepare("UPDATE users SET status = 'inactive' WHERE id = ?")->execute([$id]);
        echo json_encode(['status' => 'success', 'message' => 'User berhasil dinonaktifkan.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
?>
