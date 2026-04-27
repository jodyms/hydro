<?php
require_once 'db.php';

try {
    $pdo->exec("ALTER TABLE installations ADD COLUMN visit_schedule_date DATE AFTER replacement_date");
    echo "Column visit_schedule_date added successfully.";
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo "Column visit_schedule_date already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>
