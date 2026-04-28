<?php
require_once 'db.php';

try {
    $stmt = $pdo->query("SHOW COLUMNS FROM installations LIKE 'followup_date'");
    $column = $stmt->fetch();

    if ($column) {
        echo "Column followup_date already exists.";
    } else {
        $pdo->exec("ALTER TABLE installations ADD COLUMN followup_date DATE AFTER replacement_date");
        echo "Column followup_date added successfully.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
