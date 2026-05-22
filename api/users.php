<?php
require 'db.php';
require_once 'authz.php';

$method = $_SERVER['REQUEST_METHOD'];
$auth = authz_require_auth($pdo);

if ($method === 'GET') {
    authz_require_permission($auth, 'user_read');
    $user_id = $auth['user_id'];
    $requestedShowAll = authz_get_bool($_GET['show_all'] ?? null, false);
    $show_all = authz_allow_show_all($auth, $requestedShowAll, ['user_showall']);

    try {
        if ($show_all) {
            $stmt = $pdo->query("SELECT u.id, u.username, u.email, u.phone, u.status, u.role_id, r.role_name, c.username as creator_name, u2.username as last_editor_name 
                                 FROM users u 
                                 JOIN roles r ON u.role_id = r.id 
                                 LEFT JOIN users c ON u.created_by = c.id
                                 LEFT JOIN users u2 ON u.updated_by = u2.id
                                 ORDER BY u.id DESC");
        } else {
            // Logic: Show self + users who share at least one team with the requesting user
            $stmt = $pdo->prepare("SELECT DISTINCT u.id, u.username, u.email, u.phone, u.status, u.role_id, r.role_name, c.username as creator_name, u2.username as last_editor_name 
                                 FROM users u 
                                 JOIN roles r ON u.role_id = r.id 
                                 LEFT JOIN users c ON u.created_by = c.id
                                 LEFT JOIN users u2 ON u.updated_by = u2.id
                                 WHERE u.id = ?
                                    OR u.id IN (
                                        SELECT DISTINCT tm2.user_id
                                        FROM team_members tm1
                                        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                                        WHERE tm1.user_id = ?
                                    )
                                 ORDER BY u.id DESC");
            $stmt->execute([$user_id, $user_id]);
        }
        $users = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data pengguna.']);
    }
    exit;
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update') {
    authz_require_permission($auth, 'user_update');
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
        $stmt->execute([$role_id, $status, $phone, $auth['user_id'], $id]);
        echo json_encode(['status' => 'success', 'message' => 'Data User berhasil diubah.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah data user.']);
    }
    exit;
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'deactivate') {
    authz_require_permission($auth, 'user_delete');
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
        echo json_encode(['status' => 'error', 'message' => 'Gagal menonaktifkan user.']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Metode tidak diizinkan.']);
?>
