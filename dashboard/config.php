<?php
// config.php
// Database Configuration for the Dashboard

$host = 'localhost';
$dbname = 'u197845267_LB'; // Change to your shared hosting DB name
$user = 'u197845267_remote';          // Change to your shared hosting DB user
$password = 'Pass#4235';          // Change to your shared hosting DB password

// Set timezone (adjust as needed)
date_default_timezone_set('Africa/Tripoli');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection failed: " . htmlspecialchars($e->getMessage()));
}
?>
