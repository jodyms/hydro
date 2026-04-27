<?php
$_GET['action'] = 'list';
try {
    require 'd:/Hydromart/api/installations.php';
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
?>
