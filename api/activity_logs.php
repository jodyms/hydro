<?php
require 'db.php';
require_once 'authz.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$auth = authz_require_auth($pdo);

if ($action === 'list') {
    authz_require_permission($auth, 'history_read');
    $company_id = $_GET['company_id'] ?? null;
    $installation_id = $_GET['installation_id'] ?? null;
    $canShowAll = authz_has_permission($auth, 'history_showall');
    $viewerId = $auth['user_id'];
    
    try {
        $sql = "SELECT al.*, u.username as user_name 
                FROM installation_activity_logs al 
                LEFT JOIN users u ON al.user_id = u.id";
        $params = [];
        $visibilityClause = " al.company_id IN (
                SELECT c.id
                FROM companies c
                WHERE c.created_by = ?
                   OR c.assigned_sales_id = ?
                   OR c.created_by IN (
                        SELECT DISTINCT tm2.user_id
                        FROM team_members tm1
                        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                        WHERE tm1.user_id = ?
                   )
                   OR c.assigned_sales_id IN (
                        SELECT DISTINCT tm2.user_id
                        FROM team_members tm1
                        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                        WHERE tm1.user_id = ?
                   )
            )";
        
        if ($company_id) {
            if ($canShowAll) {
                $sql .= " WHERE al.company_id = ?";
                $params[] = $company_id;
            } else {
                $sql .= " WHERE al.company_id = ? AND " . $visibilityClause;
                $params[] = $company_id;
                $params[] = $viewerId;
                $params[] = $viewerId;
                $params[] = $viewerId;
                $params[] = $viewerId;
            }
        } elseif ($installation_id) {
            if ($canShowAll) {
                $sql .= " WHERE al.installation_id = ?";
                $params[] = $installation_id;
            } else {
                $sql .= " WHERE al.installation_id = ? AND " . $visibilityClause;
                $params[] = $installation_id;
                $params[] = $viewerId;
                $params[] = $viewerId;
                $params[] = $viewerId;
                $params[] = $viewerId;
            }
        } elseif (!$canShowAll) {
            $sql .= " WHERE " . $visibilityClause;
            $params[] = $viewerId;
            $params[] = $viewerId;
            $params[] = $viewerId;
            $params[] = $viewerId;
        }
        
        $sql .= " ORDER BY al.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil log aktivitas.']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
