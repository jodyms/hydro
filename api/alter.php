<?php
require 'db.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
    echo "Column phone added to users.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>
