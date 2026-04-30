require_once 'config.php';

echo "Updating print_date for visitors...\n";

try {

    // 1. Onsite records (onlineRegID IS NULL) that have printed their badge
    $stmt1 = $pdo->exec("UPDATE v2_visitors SET print_date = created_at WHERE onlineRegID IS NULL AND print_count > 0 AND print_date IS NULL");
    
    // 2. Online records (onlineRegID IS NOT NULL) that have printed their badge
    $stmt2 = $pdo->exec("UPDATE v2_visitors SET print_date = NOW() WHERE onlineRegID IS NOT NULL AND print_count > 0 AND print_date IS NULL");
    
    echo "Successfully updated $stmt1 onsite records to use their creation timestamp.\n";
    echo "Successfully updated $stmt2 online records to use the current timestamp (NOW).\n";

} catch (Exception $e) {
    echo "Fatal Error: " . htmlspecialchars($e->getMessage()) . "\n";
}
?>
