<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'list') {
    try {
        $stmt = $pdo->prepare("SELECT c.*, r.region_name, i.industry_name, ct.type_name as type, u.username as creator_name, u2.username as last_editor_name 
                               FROM companies c 
                               LEFT JOIN regions r ON c.region_id = r.id 
                               LEFT JOIN industries i ON c.industry_id = i.id 
                               LEFT JOIN company_types ct ON c.type_id = ct.id
                               LEFT JOIN users u ON c.created_by = u.id
                               LEFT JOIN users u2 ON c.updated_by = u2.id
                               ORDER BY c.name ASC");
        $stmt->execute();
        $companies = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $companies]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'list_metadata') {
    try {
        $industries = $pdo->query("SELECT * FROM industries ORDER BY (industry_name = 'Lainnya'), industry_name ASC")->fetchAll();
        $types = $pdo->query("SELECT * FROM company_types ORDER BY type_name ASC")->fetchAll();
        $statuses = $pdo->query("SELECT * FROM statuses ORDER BY id ASC")->fetchAll();
        echo json_encode([
            'status' => 'success', 
            'industries' => $industries,
            'types' => $types,
            'statuses' => $statuses
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = $data['name'] ?? '';
    $address = $data['address'] ?? '';
    $industry_id = $data['industry_id'] ?? null;
    $new_industry = $data['industry_name'] ?? ''; 
    $region_id = $data['region_id'] ?? null;
    $type_id = $data['type_id'] ?? 2; 
    $user_id = $data['user_id'] ?? null; 
    
    if (!$name) {
        echo json_encode(['status' => 'error', 'message' => 'Nama perusahaan wajib diisi.']);
        exit;
    }
    
    try {
        if ($new_industry) {
            $stmtInd = $pdo->prepare("INSERT IGNORE INTO industries (industry_name, created_by) VALUES (?, ?)");
            $stmtInd->execute([$new_industry, $user_id]);
            $stmtIndId = $pdo->prepare("SELECT id FROM industries WHERE industry_name = ?");
            $stmtIndId->execute([$new_industry]);
            $industry_id = $stmtIndId->fetchColumn();
        }

        $stmt = $pdo->prepare("INSERT INTO companies (name, address, industry_id, region_id, type_id, status_active, created_by, assigned_sales_id) VALUES (?, ?, ?, ?, ?, 1, ?, ?)");
        // assigned_sales_id initially set to creator (user_id)
        $stmt->execute([$name, $address, $industry_id, $region_id, $type_id, $user_id, $user_id]);
        $newId = $pdo->lastInsertId();
        
        $stmtRes = $pdo->prepare("SELECT c.*, r.region_name, i.industry_name, ct.type_name as type 
                                  FROM companies c 
                                  LEFT JOIN regions r ON c.region_id = r.id 
                                  LEFT JOIN industries i ON c.industry_id = i.id 
                                  LEFT JOIN company_types ct ON c.type_id = ct.id
                                  WHERE c.id = ?");
        $stmtRes->execute([$newId]);
        echo json_encode(['status' => 'success', 'message' => 'Company berhasil ditambahkan.', 'data' => $stmtRes->fetch()]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $name = $data['name'] ?? '';
    $address = $data['address'] ?? '';
    $industry_id = $data['industry_id'] ?? null;
    $new_industry = $data['industry_name'] ?? ''; 
    $region_id = $data['region_id'] ?? null;
    $type_id = $data['type_id'] ?? null;
    $user_id = $data['user_id'] ?? null; // For potential tracking, but not changing created_by
    
    if (!$id || !$name) {
        echo json_encode(['status' => 'error', 'message' => 'ID dan Nama wajib diisi.']);
        exit;
    }
    
    try {
        if ($new_industry) {
            $stmtInd = $pdo->prepare("INSERT IGNORE INTO industries (industry_name, created_by) VALUES (?, ?)");
            $stmtInd->execute([$new_industry, $user_id]);
            $stmtIndId = $pdo->prepare("SELECT id FROM industries WHERE industry_name = ?");
            $stmtIndId->execute([$new_industry]);
            $industry_id = $stmtIndId->fetchColumn();
        }

        // assigned_sales_id NOT updated here to maintain "handover logic"
        $stmt = $pdo->prepare("UPDATE companies SET name = :name, address = :address, industry_id = :industry_id, region_id = :region_id, type_id = :type_id, updated_by = :user_id WHERE id = :id");
        $stmt->execute([
            'id' => $data['id'],
            'name' => $data['name'],
            'address' => $data['address'] ?? '',
            'industry_id' => $data['industry_id'],
            'region_id' => $data['region_id'],
            'type_id' => $data['type_id'],
            'user_id' => $data['user_id'] ?? null
        ]);
        echo json_encode(['status' => 'success', 'message' => 'Data berhasil diperbarui.']);
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
        $stmt = $pdo->prepare("UPDATE companies SET status_active = NOT status_active WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success', 'message' => 'Status berhasil diubah.']);
    } catch (PDOException $e) { echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
    exit;
}

if ($action === 'convert_to_customer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id) { echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi.']); exit; }
    try {
        $stmt = $pdo->prepare("UPDATE companies SET type_id = 1 WHERE id = ?"); // 1 = Customer
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success', 'message' => 'Status diubah menjadi Customer.']);
    } catch (PDOException $e) { echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
