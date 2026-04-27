<?php
require 'db.php';

function check_created_by($table) {
    global $pdo;
    $stmt = $pdo->query("DESC $table");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    return in_array('created_by', $cols);
}

function check_assigned_sales($table) {
    global $pdo;
    $stmt = $pdo->query("DESC $table");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    return in_array('assigned_sales_id', $cols);
}

echo "Companies: created_by=" . (check_created_by('companies') ? 'YES' : 'NO') . ", assigned_sales_id=" . (check_assigned_sales('companies') ? 'YES' : 'NO') . "\n";
echo "Regions: created_by=" . (check_created_by('regions') ? 'YES' : 'NO') . "\n";
echo "Industries: created_by=" . (check_created_by('industries') ? 'YES' : 'NO') . "\n";
echo "PICs: created_by=" . (check_created_by('company_pics') ? 'YES' : 'NO') . "\n";
?>
