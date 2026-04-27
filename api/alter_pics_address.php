<?php
require 'db.php';

try {
    $pdo->exec("ALTER TABLE company_pics ADD COLUMN address TEXT NULL");
    echo "Added address to company_pics\n";
} catch (Exception $e) { echo "Error: " . $e->getMessage() . "\n"; }
?>
