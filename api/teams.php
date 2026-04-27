<?php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET') {
    if ($action === 'list') {
        $user_id = $_GET['user_id'] ?? null;
        $show_all = $_GET['show_all'] === 'true';

        try {
            if ($show_all) {
                $stmt = $pdo->query("SELECT t.*, u.username as creator_name, u2.username as last_editor_name, 
                                     (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
                                     FROM teams t 
                                     LEFT JOIN users u ON t.created_by = u.id 
                                     LEFT JOIN users u2 ON t.updated_by = u2.id
                                     ORDER BY t.id DESC");
            } else {
                // Only show teams I created OR teams I am a member of
                $stmt = $pdo->prepare("SELECT DISTINCT t.*, u.username as creator_name, u2.username as last_editor_name,
                                       (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
                                       FROM teams t 
                                       LEFT JOIN users u ON t.created_by = u.id 
                                       LEFT JOIN users u2 ON t.updated_by = u2.id
                                       LEFT JOIN team_members tm ON t.id = tm.team_id 
                                       WHERE t.created_by = ? OR tm.user_id = ? 
                                       ORDER BY t.id DESC");
                $stmt->execute([$user_id, $user_id]);
            }
            $teams = $stmt->fetchAll();
            echo json_encode(['status' => 'success', 'data' => $teams]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'members') {
        $team_id = $_GET['team_id'] ?? null;
        if (!$team_id) {
            echo json_encode(['status' => 'error', 'message' => 'Team ID required']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("SELECT user_id FROM team_members WHERE team_id = ?");
            $stmt->execute([$team_id]);
            $member_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['status' => 'success', 'data' => $member_ids]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if ($action === 'create') {
        $name = $data['team_name'] ?? '';
        $desc = $data['description'] ?? '';
        $created_by = $data['created_by'] ?? null;
        $members = $data['members'] ?? []; // Array of user IDs

        if (!$name || !$created_by) {
            echo json_encode(['status' => 'error', 'message' => 'Nama tim dan Pembuat wajib diisi']);
            exit;
        }

        try {
            $pdo->beginTransaction();
            
            $stmt = $pdo->prepare("INSERT INTO teams (team_name, description, created_by) VALUES (?, ?, ?)");
            $stmt->execute([$name, $desc, $created_by]);
            $team_id = $pdo->lastInsertId();

            if (!empty($members)) {
                $m_stmt = $pdo->prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)");
                foreach ($members as $uid) {
                    $m_stmt->execute([$team_id, $uid]);
                }
            }

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Tim berhasil dibuat']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'update') {
        $id = $data['id'] ?? null;
        $name = $data['team_name'] ?? '';
        $desc = $data['description'] ?? '';
        $status = $data['status'] ?? 'active';
        $members = $data['members'] ?? [];

        if (!$id || !$name) {
            echo json_encode(['status' => 'error', 'message' => 'ID dan Nama tim wajib diisi']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("UPDATE teams SET team_name = ?, description = ?, status = ?, updated_by = ? WHERE id = ?");
            $stmt->execute([$name, $desc, $status, $data['user_id'] ?? null, $id]);

            // Sync members: delete all and re-insert
            $pdo->prepare("DELETE FROM team_members WHERE team_id = ?")->execute([$id]);
            if (!empty($members)) {
                $m_stmt = $pdo->prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)");
                foreach ($members as $uid) {
                    $m_stmt->execute([$id, $uid]);
                }
            }

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Data tim berhasil diperbarui']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'deactivate') {
        $id = $data['id'] ?? null;
        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'ID Tim required']);
            exit;
        }
        try {
            $pdo->prepare("UPDATE teams SET status = 'inactive' WHERE id = ?")->execute([$id]);
            echo json_encode(['status' => 'success', 'message' => 'Tim berhasil dinonaktifkan']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }
}

echo json_encode(['status' => 'error', 'message' => 'Invalid Request']);
?>
