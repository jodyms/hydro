<?php
require_once 'db.php';

try {
    $stmt = $pdo->query("SHOW COLUMNS FROM installations LIKE 'product_notes'");
    $column = $stmt->fetch();

    if ($column) {
        echo "Column product_notes already exists.";
    } else {
        $pdo->exec("ALTER TABLE installations ADD COLUMN product_notes TEXT NULL AFTER followup_date");
        echo "Column product_notes added successfully.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
