<?php
require 'db.php';

try {
    // Check if industry_category exists in companies
    $stmt = $pdo->query("DESC companies");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('industry_category', $cols)) {
        $pdo->exec("ALTER TABLE companies DROP COLUMN industry_category");
        echo "Dropped industry_category from companies\n";
    }
} catch (Exception $e) { echo "Error altering companies: " . $e->getMessage() . "\n"; }

try {
    // Check if address exists in company_pics
    $stmt = $pdo->query("DESC company_pics");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('address', $cols)) {
        $pdo->exec("ALTER TABLE company_pics DROP COLUMN address");
        echo "Dropped address from company_pics\n";
    }
} catch (Exception $e) { echo "Error altering company_pics: " . $e->getMessage() . "\n"; }
?>
