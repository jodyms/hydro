<?php
require 'db.php';
require_once 'authz.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$auth = authz_require_auth($pdo);

// GET: roles list or permissions matrix
if ($method === 'GET') {
    if ($action === 'permissions') {
        authz_require_permission($auth, 'role_set_authority');
        $role_id = $_GET['role_id'] ?? null;
        try {
            // Group permissions by menu prefix for nice UI
            $stmt = $pdo->query("SELECT id, permission_name, description FROM permissions ORDER BY permission_name ASC");
            $allPerms = $stmt->fetchAll();
            
            $assigned = [];
            if ($role_id) {
                $stmt2 = $pdo->prepare("SELECT permission_id FROM role_permissions WHERE role_id = ?");
                $stmt2->execute([$role_id]);
                $assigned = $stmt2->fetchAll(PDO::FETCH_COLUMN);
            }
            
            echo json_encode(['status' => 'success', 'data' => ['all' => $allPerms, 'assigned' => $assigned]]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data otorisasi role.']);
        }
        exit;
    }

    if ($action === 'list') {
        authz_require_permission($auth, 'role_read');
        $user_id = $auth['user_id'];
        $requestedShowAll = authz_get_bool($_GET['show_all'] ?? null, false);
        $show_all = authz_allow_show_all($auth, $requestedShowAll, ['role_showall']);

        try {
            if ($show_all) {
                $stmt = $pdo->query("SELECT r.*, c.username as creator_name, u2.username as last_editor_name FROM roles r LEFT JOIN users c ON r.created_by = c.id LEFT JOIN users u2 ON r.updated_by = u2.id ORDER BY r.id DESC");
            } else {
                $stmt = $pdo->prepare("SELECT DISTINCT r.*, c.username as creator_name, u2.username as last_editor_name 
                                     FROM roles r 
                                     LEFT JOIN users c ON r.created_by = c.id
                                     LEFT JOIN users u2 ON r.updated_by = u2.id
                                     JOIN team_members tm1 ON r.created_by = tm1.user_id
                                     JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                                     WHERE tm2.user_id = ?
                                     ORDER BY r.id DESC");
                $stmt->execute([$user_id]);
            }
            $roles = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $roles]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil daftar role.']);
        }
        exit;
    }

    // Default: list roles
    authz_require_any_permission($auth, ['role_read', 'user_read']);
    try {
        $stmt = $pdo->query("SELECT id, role_name, description, status FROM roles ORDER BY id ASC");
        $roles = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $roles]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data role.']);
    }
    exit;
}

// POST actions
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($action === 'save_permissions') {
        authz_require_permission($auth, 'role_set_authority');
        $role_id = $data['role_id'] ?? null;
        $permission_ids = $data['permission_ids'] ?? [];
        
        if (!$role_id) {
            echo json_encode(['status' => 'error', 'message' => 'Role tidak valid.']);
            exit;
        }
        
        try {
            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?")->execute([$role_id]);
            
            if (!empty($permission_ids)) {
                $ins = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                foreach ($permission_ids as $pid) {
                    $ins->execute([$role_id, $pid]);
                }
            }
            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Otoritas berhasil disimpan.']);
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan otorisasi role.']);
        }
        exit;
    }

    if ($action === 'create') {
        authz_require_permission($auth, 'role_create');
        $role_name = $data['role_name'] ?? '';
        $description = $data['description'] ?? '';
        $user_id = $auth['user_id'];

        if (!$role_name) {
            echo json_encode(['status' => 'error', 'message' => 'Nama Role tidak boleh kosong.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO roles (role_name, description, status, created_by) VALUES (?, ?, 'active', ?)");
            $stmt->execute([$role_name, $description, $user_id]);
            echo json_encode(['status' => 'success', 'message' => 'Role baru berhasil ditambahkan.']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal menambah role.']);
        }
        exit;
    }

    if ($action === 'update') {
        authz_require_permission($auth, 'role_update');
        $id = $data['id'] ?? null;
        $role_name = $data['role_name'] ?? '';
        $description = $data['description'] ?? '';
        $status = $data['status'] ?? 'active';

        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'ID Role tidak boleh kosong.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE roles SET role_name = ?, description = ?, status = ?, updated_by = ? WHERE id = ?");
            $stmt->execute([$role_name, $description, $status, $auth['user_id'], $id]);
            echo json_encode(['status' => 'success', 'message' => 'Data Role berhasil diperbarui.']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui role.']);
        }
        exit;
    }

    if ($action === 'deactivate') {
        authz_require_permission($auth, 'role_delete');
        $id = $data['id'] ?? null;
        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'ID Role tidak boleh kosong.']);
            exit;
        }
        try {
            $pdo->prepare("UPDATE roles SET status = 'inactive' WHERE id = ?")->execute([$id]);
            echo json_encode(['status' => 'success', 'message' => 'Role berhasil dinonaktifkan.']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal menonaktifkan role.']);
        }
        exit;
    }
}

echo json_encode(['status' => 'error', 'message' => 'Permintaan tidak valid.']);
?>
