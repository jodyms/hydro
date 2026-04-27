<?php
require 'db.php';

function desc($table) {
    global $pdo;
    echo "Table: $table\n";
    $stmt = $pdo->query("DESC $table");
    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    echo "\n";
}

desc('companies');
desc('company_pics');
desc('industries');
?>
