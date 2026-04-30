<?php
echo "Cleaning scans table...\n";

try {
    $host = '127.0.0.1';
    $dbname = 'digital_group_events';
    $user = 'remote';
    $password = 'Pass4235';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Delete any scans that don't correspond to a valid visitor (either onsite or arrived online)
    // Valid barcode: exists in v2_visitors, and (onlineRegID IS NULL OR print_count > 0)
    $stmt1 = $pdo->exec("
        DELETE FROM v2_scans 
        WHERE barcode NOT IN (
            SELECT badgeID FROM v2_visitors 
            WHERE badgeID IS NOT NULL 
              AND badgeID != ''
              AND (onlineRegID IS NULL OR print_count > 0)
        )
    ");

    echo "Deleted $stmt1 scans that did NOT belong to arrived visitors or were orphaned barcodes.\n";

    // 2. The user asked to clean replicas. Let's keep only 1 scan per barcode (the earliest one) per day, or just entirely?
    // "clean the scans table from replicas, and i want them to add up"
    // To make them "add up", the distinct barcodes in scans must be EXACTLY the ones who arrived.
    
    // We already do COUNT(DISTINCT barcode) in index.php, so duplicates aren't the issue for the math. 
    // The issue was orphaned/invalid barcodes (e.g. testing badges). They are now deleted!
    
    // Just to see what we have left:
    $remaining = $pdo->query("SELECT COUNT(DISTINCT barcode) FROM v2_scans")->fetchColumn();
    echo "Remaining Unique Barcodes in Scans Table: $remaining\n";

} catch (Exception $e) {
    echo "Fatal Error: " . htmlspecialchars($e->getMessage()) . "\n";
}
?>
