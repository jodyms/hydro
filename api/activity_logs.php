<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'list') {
    $company_id = $_GET['company_id'] ?? null;
    $installation_id = $_GET['installation_id'] ?? null;
    
    try {
        $sql = "SELECT al.*, u.username as user_name 
                FROM installation_activity_logs al 
                LEFT JOIN users u ON al.user_id = u.id";
        $params = [];
        
        if ($company_id) {
            $sql .= " WHERE al.company_id = ?";
            $params[] = $company_id;
        } elseif ($installation_id) {
            $sql .= " WHERE al.installation_id = ?";
            $params[] = $installation_id;
        }
        
        $sql .= " ORDER BY al.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
