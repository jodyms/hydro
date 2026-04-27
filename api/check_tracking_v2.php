<?php
require 'db.php';

foreach(['companies', 'regions', 'industries', 'company_pics'] as $t) {
    echo "Table: $t\n";
    $stmt = $pdo->query("DESC $t");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($cols as $c) {
        if (in_array($c['Field'], ['created_by', 'assigned_sales_id'])) {
            echo "- " . $c['Field'] . "\n";
        }
    }
}
?>
