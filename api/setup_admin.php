<?php
require 'db.php';

echo "<html><body style='font-family: sans-serif; padding: 20px; text-align: center; background: #f8fafc; color: #0f172a;'>";
echo "<div style='background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0; display: inline-block;'>";

try {
    $username = 'Admin';
    $password = 'demo123';
    $email = 'admin@huiwater.local';
    // Gunakan fungsi BCRYPT native PHP (Sangat aman)
    $hash = password_hash($password, PASSWORD_BCRYPT);
    
    // Periksa apakah peran Admin (biasanya ID 1) sudah ada.
    // Jika tidak, kita bisa menargetkan dengan subquery, akan tetapi
    // ID 1 telah kita pastikan di file Schema .sql adalah Admin 
    
    $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, email, role_id, status) VALUES (?, ?, ?, 1, 'active')");
    $stmt->execute([$username, $hash, $email]);
    
    echo "<h1 style='color: #059669;'>💎 Berhasil Terinjeksi!</h1>";
    echo "<p>Akun Administrator Utama telah dikukuhkan ke dalam Database MySQL.</p>";
    echo "<table style='text-align: left; margin: 20px auto; border-collapse: collapse;'>";
    echo "<tr><td style='padding: 8px; border: 1px solid #e2e8f0;'><b>Username</b></td><td style='padding: 8px; border: 1px solid #e2e8f0;'>{$username}</td></tr>";
    echo "<tr><td style='padding: 8px; border: 1px solid #e2e8f0;'><b>Password (Unencrypted)</b></td><td style='padding: 8px; border: 1px solid #e2e8f0;'>{$password}</td></tr>";
    echo "<tr><td style='padding: 8px; border: 1px solid #e2e8f0;'><b>Hash BCRYPT Tersimpan</b></td><td style='padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;'>{$hash}</td></tr>";
    echo "</table>";
    echo "<p>Kini Anda bisa masuk menggunakan kombinasi user & pass di antarmuka Web React Anda.</p>";
    echo "<p style='color: #ef4444; font-size: 14px;'><i>Catatan: Sangat disarankan menghapus file <b>setup_admin.php</b> ini saat server diunggah ke internet (cPanel).</i></p>";
    
} catch (PDOException $e) {
    if($e->errorInfo[1] == 1062) {
        echo "<h1 style='color: #f59e0b;'>⚠️ Akun Sudah Ada</h1>";
        echo "<p>Sistem mendeteksi bahwa Akun 'Admin' rupanya sudah pernah diinjeksi ke Database sebelumnya.</p>";
    } else {
        echo "<h1 style='color: #ef4444;'>❌ Galat Operasi Tabel</h1>";
        echo "<p>" . $e->getMessage() . "</p>";
    }
}

echo "</div></body></html>";
?>
