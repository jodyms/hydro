<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $user = $data['username'] ?? '';
    $pass = $data['password'] ?? '';
    
    if(!$user || !$pass) {
        echo json_encode(['status' => 'error', 'message' => 'Username dan password wajib diisi.']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT u.id, u.username, u.password_hash, u.email, u.phone, u.role_id, u.status, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ? LIMIT 1");
    $stmt->execute([$user]);
    $userData = $stmt->fetch();
    
    if ($userData && password_verify($pass, $userData['password_hash'])) {
        if($userData['status'] !== 'active') {
             echo json_encode(['status' => 'error', 'message' => 'Akun ditangguhkan atau tidak aktif!']);
             exit;
        }
        
        // Buat Session Token Sederhana
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+2 hours'));
        
        $sessStmt = $pdo->prepare("INSERT INTO user_sessions (id, user_id, expires_at) VALUES (?, ?, ?)");
        $sessStmt->execute([$token, $userData['id'], $expires]);
        
        // Ambil Daftar Otoritas (Permissions)
        $permStmt = $pdo->prepare("SELECT p.permission_name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?");
        $permStmt->execute([$userData['role_id']]);
        $permissions = $permStmt->fetchAll(PDO::FETCH_COLUMN);

        echo json_encode([
            'status' => 'success', 
            'message' => 'Login Berhasil', 
            'token' => $token, 
            'user' => [
                'id' => $userData['id'],
                'username' => $userData['username'],
                'email' => $userData['email'],
                'phone' => $userData['phone'],
                'role_id' => $userData['role_id'],
                'role_name' => $userData['role_name'],
                'permissions' => $permissions
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Username atau Password keliru!']);
    }
    exit;
}

if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $email = $data['email'] ?? '';
    
    // Perhatikan basic validasi
    if(!$username || !$password || !$email) {
        echo json_encode(['status' => 'error', 'message' => 'Semua data formulir pendaftaran wajib diisi penuh.']);
        exit;
    }
    
    $role_id = isset($data['role_id']) ? (int)$data['role_id'] : 3;

    try {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        
        $phone = isset($data['phone']) ? $data['phone'] : '';
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, email, phone, role_id, status) VALUES (?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$username, $hash, $email, $phone, $role_id]);
        
        echo json_encode(['status' => 'success', 'message' => 'Registrasi Akun sukses. Silakan coba masuk (Login).']);
    } catch(PDOException $e) {
        if($e->errorInfo[1] == 1062) {
             echo json_encode(['status' => 'error', 'message' => 'Nama pengguna (Username) atau Email sudah pernah diambil.']);
        } else {
             echo json_encode(['status' => 'error', 'message' => 'Sistem gagal menyuntik data: ' . $e->getMessage()]);
        }
    }
    exit;
}

if ($action === 'update_profile' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['id'] ?? null;
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $password = $data['password'] ?? '';

    if(!$user_id || !$email) {
        echo json_encode(['status' => 'error', 'message' => 'Data profil utama (ID/Email) tidak boleh kosong.']);
        exit;
    }

    try {
        if (!empty($password)) {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET email = ?, phone = ?, password_hash = ? WHERE id = ?");
            $stmt->execute([$email, $phone, $hash, $user_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET email = ?, phone = ? WHERE id = ?");
            $stmt->execute([$email, $phone, $user_id]);
        }
        
        $stmt2 = $pdo->prepare("SELECT u.id, u.username, u.email, u.phone, u.role_id, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?");
        $stmt2->execute([$user_id]);
        $updatedUser = $stmt2->fetch();

        echo json_encode(['status' => 'success', 'message' => 'Profil berhasil diperbarui.', 'user' => $updatedUser]);
    } catch(PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui profil: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'test-db') {
    echo json_encode(['status' => 'success', 'message' => 'Koneksi ke hydromar_sales (via PHP Native PDO) BERDASARKAN PARAMETER LOKAL BERHASIL!']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi REST API tidak direkognisi oleh Server PHP.']);
?>
