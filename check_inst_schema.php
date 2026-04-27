<?php
require 'api/db.php';
$sq = $pdo->query('DESCRIBE installations');
while($r = $sq->fetch(PDO::FETCH_ASSOC)){
    echo $r['Field'] . "\n";
}
