<?php
require 'db.php';

try {
    $stmt = $pdo->query("SELECT * FROM company_types");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
