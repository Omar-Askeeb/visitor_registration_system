require_once 'config.php';

echo "<h2>Starting scan synchronization...</h2>";

try {

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $visitorTable = in_array('v2_visitors', $tables) ? 'v2_visitors' : 'visitors';
    $scanTable = in_array('v2_scans', $tables) ? 'v2_scans' : 'scans';

    echo "Using Visitor Table: <strong>$visitorTable</strong>\n";
    echo "Using Scan Table: <strong>$scanTable</strong>\n\n";

    $visitorCols = $pdo->query("DESCRIBE $visitorTable")->fetchAll(PDO::FETCH_COLUMN);
    $scanCols = $pdo->query("DESCRIBE $scanTable")->fetchAll(PDO::FETCH_COLUMN);
    
    $hasPrintDate = in_array('print_date', $visitorCols);
    $hasEventId = in_array('event_id', $scanCols);

    $selectCols = "id, badgeID, created_at";
    if (in_array('event_id', $visitorCols)) $selectCols .= ", event_id";
    if ($hasPrintDate) $selectCols .= ", print_date";

    $visitors = $pdo->query("SELECT $selectCols FROM $visitorTable WHERE print_count > 0 AND badgeID IS NOT NULL AND badgeID != ''");

    $added = 0;
    $errors = 0;

    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM $scanTable WHERE barcode = ?");
    
    if ($hasEventId) {
        $stmtInsert = $pdo->prepare("INSERT INTO $scanTable (barcode, timestamp, gate_details, event_id) VALUES (?, ?, 'Auto-Recovered', ?)");
    } else {
        $stmtInsert = $pdo->prepare("INSERT INTO $scanTable (barcode, timestamp, gate_details) VALUES (?, ?, 'Auto-Recovered')");
    }

    while ($visitor = $visitors->fetch(PDO::FETCH_ASSOC)) {
        $stmtCheck->execute([$visitor['badgeID']]);
        $exists = $stmtCheck->fetchColumn();

        if ($exists == 0) {
            $scanTime = $visitor['created_at']; 
            
            if ($hasPrintDate && !empty($visitor['print_date'])) {
                $scanTime = $visitor['print_date'];
            }
            
            try {
                if ($hasEventId) {
                    $eventId = $visitor['event_id'] ?? 1;
                    $stmtInsert->execute([$visitor['badgeID'], $scanTime, $eventId]);
                } else {
                    $stmtInsert->execute([$visitor['badgeID'], $scanTime]);
                }
                $added++;
            } catch (Exception $e) {
                echo "Error inserting for barcode " . htmlspecialchars($visitor['badgeID']) . ": " . $e->getMessage() . "\n";
                $errors++;
            }
        }
    }

    echo "\nFinished!\n";
    echo "Added $added missing scan records.\n";
    if ($errors > 0) {
        echo "Errors encountered: $errors\n";
    }
    
} catch (Exception $e) {
    echo "Fatal Error: " . htmlspecialchars($e->getMessage()) . "\n";
}
?>
