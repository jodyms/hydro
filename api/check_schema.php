<?php
require 'db.php';

function check_status($table) {
    global $pdo;
    $stmt = $pdo->query("DESCRIBE $table");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $has_status = false;
    foreach(['status', 'status_active', 'active'] as $s) {
        if (in_array($s, $cols)) {
            $has_status = $s;
            break;
        }
    }
    return $has_status;
}

echo "Companies: " . (check_status('companies') ?: 'NONE') . "\n";
echo "Regions: " . (check_status('regions') ?: 'NONE') . "\n";
echo "PICs: " . (check_status('company_pics') ?: 'NONE') . "\n";
echo "Users: " . (check_status('users') ?: 'NONE') . "\n";
echo "Roles: " . (check_status('roles') ?: 'NONE') . "\n";
echo "Teams: " . (check_status('teams') ?: 'NONE') . "\n";
?>
