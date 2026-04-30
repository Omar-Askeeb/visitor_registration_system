<?php
$host = 'localhost';

function checkDb($dbname, $user, $pass) {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "Connected to $dbname\n";
        
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        
        $scanTable = 'scans';
        if (in_array('v2_scans', $tables)) $scanTable = 'v2_scans';
        
        if (in_array($scanTable, $tables)) {
            echo "Schema for $scanTable in $dbname:\n";
            $stmt = $pdo->query("DESCRIBE $scanTable");
            print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
        } else {
            echo "$scanTable table not found.\n";
        }
    } catch (Exception $e) {
        echo "Could not connect to $dbname: " . $e->getMessage() . "\n";
    }
}

// Check local backend
checkDb('digital_group_events', 'remote', 'Pass4235');

// Check dashboard DB from config.php
checkDb('u197845267_LB', 'u197845267_remote', 'Pass#4235');
