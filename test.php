<?php
require 'd:/Hydromart/api/db.php';
$stmt = $pdo->query('SHOW FULL TABLES');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
$stmt2 = $pdo->query('DESC installations');
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
?>
