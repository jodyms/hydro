<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'list') {
    $user_id = $_GET['user_id'] ?? null;
    $show_all = isset($_GET['show_all']) ? ($_GET['show_all'] === 'true') : true;

    try {
        $base_query = "SELECT p.*, c.name as company_name, u2.username as last_editor_name 
                       FROM company_pics p 
                       JOIN companies c ON p.company_id = c.id 
                       LEFT JOIN users u2 ON p.updated_by = u2.id";
        
        if ($show_all || !$user_id) {
            $stmt = $pdo->prepare($base_query . " ORDER BY p.status ASC, p.name ASC");
            $stmt->execute();
        } else {
            // PIC visibility follows Company visibility
            $stmt = $pdo->prepare($base_query . "
                       WHERE c.created_by = ? OR c.assigned_sales_id = ?
                          OR c.created_by IN (
                               SELECT DISTINCT tm2.user_id FROM team_members tm1
                               JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                               WHERE tm1.user_id = ?
                          )
                          OR c.assigned_sales_id IN (
                               SELECT DISTINCT tm2.user_id FROM team_members tm1
                               JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                               WHERE tm1.user_id = ?
                          )
                       ORDER BY p.status ASC, p.name ASC");
            $stmt->execute([$user_id, $user_id, $user_id, $user_id]);
        }
        $pics = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $pics]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data PIC.']);
    }
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $company_id = $data['company_id'] ?? null;
    $name = $data['name'] ?? '';
    $job_title = $data['job_title'] ?? '';
    $phone = $data['phone'] ?? '';
    $dob = $data['dob'] ?? null;
    $email = $data['email'] ?? '';
    $address = $data['address'] ?? '';
    $user_id = $data['user_id'] ?? null;
    
    if (!$company_id || !$name) {
        echo json_encode(['status' => 'error', 'message' => 'Company dan Nama PIC wajib diisi.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO company_pics (company_id, name, job_title, phone, dob, email, address, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)");
        $stmt->execute([$company_id, $name, $job_title, $phone, $dob ?: null, $email, $address, $user_id]);
        echo json_encode(['status' => 'success', 'message' => 'PIC berhasil ditambahkan.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menambahkan PIC.']);
    }
    exit;
}

if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $company_id = $data['company_id'] ?? null;
    $name = $data['name'] ?? '';
    $job_title = $data['job_title'] ?? '';
    $phone = $data['phone'] ?? '';
    $dob = $data['dob'] ?? null;
    $email = $data['email'] ?? '';
    $address = $data['address'] ?? '';
    
    if (!$id || !$company_id || !$name) {
        echo json_encode(['status' => 'error', 'message' => 'ID, Company, dan Nama wajib diisi.']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE company_pics SET company_id = ?, name = ?, job_title = ?, phone = ?, dob = ?, email = ?, address = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$company_id, $name, $job_title, $phone, $dob ?: null, $email, $address, $data['user_id'] ?? null, $id]);
        echo json_encode(['status' => 'success', 'message' => 'PIC berhasil diperbarui.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui data PIC.']);
    }
    exit;
}

if ($action === 'toggle_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id) { echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi.']); exit; }
    try {
        $stmt = $pdo->prepare("UPDATE company_pics SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success', 'message' => 'Status PIC berhasil diubah.']);
    } catch (PDOException $e) { echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah status PIC.']); }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
