<?php
require 'db.php';

try {
    $pdo->exec("ALTER TABLE regions ADD COLUMN created_by INT NULL");
    echo "Added created_by to regions\n";
} catch (Exception $e) { echo "regions: " . $e->getMessage() . "\n"; }

try {
    $pdo->exec("ALTER TABLE industries ADD COLUMN created_by INT NULL");
    echo "Added created_by to industries\n";
} catch (Exception $e) { echo "industries: " . $e->getMessage() . "\n"; }

try {
    $pdo->exec("ALTER TABLE company_pics ADD COLUMN created_by INT NULL");
    echo "Added created_by to company_pics\n";
} catch (Exception $e) { echo "company_pics: " . $e->getMessage() . "\n"; }

try {
    // Just in case columns exist but need to ensure they are there
    $pdo->exec("ALTER TABLE companies MODIFY COLUMN created_by INT NULL");
    $pdo->exec("ALTER TABLE companies MODIFY COLUMN assigned_sales_id INT NULL");
    echo "Ensured created_by and assigned_sales_id in companies are INT\n";
} catch (Exception $e) { echo "companies: " . $e->getMessage() . "\n"; }
?>
