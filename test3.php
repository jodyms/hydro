<?php
require 'd:/Hydromart/api/db.php';
try {
    $pdo->exec("ALTER TABLE installations ADD COLUMN status_active BOOLEAN DEFAULT TRUE");
    echo "Added status_active to installations\n";
} catch (Exception $e) { echo $e->getMessage() . "\n"; }
?>
