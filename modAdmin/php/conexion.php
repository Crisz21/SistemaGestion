<?php
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "bd1308";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Conexión fallida: ' . $conn->connect_error]);
    exit;
}
?>
