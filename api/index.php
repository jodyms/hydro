<?php
header("Content-Type: application/json");
echo json_encode([
    "status" => "online",
    "message" => "Hydromart Sales API is working correctly. Please use specific endpoints like /companies.php",
    "server_time" => date("Y-m-d H:i:s")
]);
?>
