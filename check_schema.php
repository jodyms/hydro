<?php
require 'api/db.php';
$stmt = $pdo->query('DESCRIBE installations');
$cols = $stmt->fetchAll();
foreach($cols as $c) {
    echo $c['Field'] . ' | ' . $c['Type'] . ' | ' . $c['Null'] . ' | ' . $c['Key'] . PHP_EOL;
}
?>
