<?php
$host = 'localhost';
$user = 'root';
$password = '';

try {
    // 1. Dashboard DB: libya_build, table: visitors
    $pdo1 = new PDO("mysql:host=$host;dbname=libya_build;charset=utf8mb4", $user, $password);
    $pdo1->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    try {
        $pdo1->exec("ALTER TABLE visitors ADD COLUMN print_date TIMESTAMP NULL DEFAULT NULL");
        echo "Added print_date to libya_build.visitors\n";
    } catch (PDOException $e) {
        echo "Could not add to libya_build.visitors: " . $e->getMessage() . "\n";
    }
} catch (PDOException $e) {
    echo "Could not connect to libya_build\n";
}

try {
    // 2. Local Backend DB: digital_group_events, table: v2_visitors
    $pdo2 = new PDO("mysql:host=$host;dbname=digital_group_events;charset=utf8mb4", 'remote', 'Pass4235'); // according to env
    $pdo2->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    try {
        $pdo2->exec("ALTER TABLE v2_visitors ADD COLUMN print_date TIMESTAMP NULL DEFAULT NULL");
        echo "Added print_date to digital_group_events.v2_visitors\n";
    } catch (PDOException $e) {
        echo "Could not add to digital_group_events.v2_visitors: " . $e->getMessage() . "\n";
    }
} catch (PDOException $e) {
    echo "Could not connect to digital_group_events\n";
}
