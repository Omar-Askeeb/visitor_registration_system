<?php
// index.php
require_once 'config.php';

// --- 1. Visitor Statistics ---
$statsQuery = $pdo->query("
    SELECT 
        COUNT(*) as total_visitors,
        SUM(CASE WHEN onlineRegID IS NULL THEN 1 ELSE 0 END) as onsite_visitors,
        SUM(CASE WHEN onlineRegID IS NOT NULL THEN 1 ELSE 0 END) as online_visitors
    FROM visitors
");
$visitorStats = $statsQuery->fetch();

// --- 2. Registration Trend (Online vs Onsite per day) ---
$trendQuery = $pdo->query("
    SELECT 
        DATE(created_at) as reg_date,
        SUM(CASE WHEN onlineRegID IS NULL THEN 1 ELSE 0 END) as onsite_count,
        SUM(CASE WHEN onlineRegID IS NOT NULL THEN 1 ELSE 0 END) as online_count
    FROM visitors
    WHERE created_at IS NOT NULL
    GROUP BY DATE(created_at)
    ORDER BY reg_date ASC
");
$registrationTrend = $trendQuery->fetchAll();

$regDates = [];
$onsiteData = [];
$onlineData = [];
foreach ($registrationTrend as $row) {
    $regDates[] = $row['reg_date'];
    $onsiteData[] = $row['onsite_count'];
    $onlineData[] = $row['online_count'];
}

// --- 3. Scan & Attendance Statistics ---
// Deduplicated logic: Same person (barcode) on the same day counts as 1.
// If they scan on 3 different days, they count as 3.
$visitsPerDayQuery = $pdo->query("
    SELECT 
        DATE(timestamp) as visit_date,
        COUNT(DISTINCT barcode) as unique_visits_today
    FROM scans
    GROUP BY DATE(timestamp)
    ORDER BY visit_date ASC
");
$visitsPerDay = $visitsPerDayQuery->fetchAll();

$visitDates = [];
$visitData = [];
$totalDeduplicatedVisits = 0;

foreach ($visitsPerDay as $row) {
    $visitDates[] = $row['visit_date'];
    $visitData[] = (int)$row['unique_visits_today'];
    $totalDeduplicatedVisits += (int)$row['unique_visits_today'];
}

// Get raw total scans just for reference
$rawScansQuery = $pdo->query("SELECT COUNT(*) as total_raw FROM scans");
$totalRawScans = $rawScansQuery->fetch()['total_raw'];
$repeatedScans = $totalRawScans - $totalDeduplicatedVisits;
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Statistics Dashboard</title>
    <script src="js/tailwind.js"></script>
    <script src="js/chart.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
    </style>
</head>
<body class="text-slate-800 antialiased p-6 md:p-10">

    <div class="max-w-7xl mx-auto space-y-8">
        
        <header class="flex justify-between items-end mb-8 border-b pb-4 border-slate-200">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Real-Time Event Dashboard</h1>
                <p class="text-slate-500 font-medium mt-1">Live statistics reflecting synchronized database records.</p>
            </div>
            <div class="bg-cyan-50 flex items-center px-4 py-2 border border-cyan-100 rounded-lg shadow-sm">
                <span class="relative flex h-3 w-3 mr-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span class="font-bold text-xs text-cyan-800 uppercase tracking-widest">Live Sync Active</span>
            </div>
        </header>

        <!-- Registrations Snapshot -->
        <h2 class="text-xl font-bold mb-4 text-slate-700">Visitor Registrations</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 border-l-4 border-l-blue-500">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Registered</div>
                <div class="text-4xl font-black text-slate-900"><?= number_format($visitorStats['total_visitors']) ?></div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 border-l-4 border-l-indigo-500">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Onsite Registrations</div>
                <div class="text-4xl font-black text-slate-900"><?= number_format($visitorStats['onsite_visitors'] ?? 0) ?></div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 border-l-4 border-l-cyan-400">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Online Registrations</div>
                <div class="text-4xl font-black text-slate-900"><?= number_format($visitorStats['online_visitors'] ?? 0) ?></div>
            </div>
        </div>

        <!-- Attendance & Scans Snapshot -->
        <h2 class="text-xl font-bold mb-4 text-slate-700 mt-10">Attendance & Scans</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div class="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 border-l-4 border-l-emerald-500">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Actual Visits</div>
                <div class="text-4xl font-black text-slate-900"><?= number_format($totalDeduplicatedVisits) ?></div>
                <div class="text-[10px] text-slate-400 mt-2 font-medium leading-tight">Counted as 1 per person per day.</div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 border-l-4 border-l-slate-400 opacity-80">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Raw Scans (Total)</div>
                <div class="text-3xl font-black text-slate-700"><?= number_format($totalRawScans) ?></div>
                <div class="text-[10px] text-slate-400 mt-2 font-medium">Every single barcode scan event.</div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 border-l-4 border-l-amber-400 opacity-80">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Repeated Scans</div>
                <div class="text-3xl font-black text-slate-700"><?= number_format($repeatedScans) ?></div>
                <div class="text-[10px] text-slate-400 mt-2 font-medium">Extra scans ignored from actual visit count.</div>
            </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Registration Chart -->
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Registrations per Day</h3>
                <div class="relative h-72">
                    <canvas id="regChart"></canvas>
                </div>
            </div>

            <!-- Visits Chart -->
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Actual Visits per Day</h3>
                <div class="relative h-72">
                    <canvas id="visitsChart"></canvas>
                </div>
            </div>
        </div>

    </div>

    <script>
        // Data for Registration Chart
        const regDates = <?= json_encode($regDates) ?>;
        const regOnsite = <?= json_encode($onsiteData) ?>;
        const regOnline = <?= json_encode($onlineData) ?>;

        const regCtx = document.getElementById('regChart').getContext('2d');
        new Chart(regCtx, {
            type: 'bar',
            data: {
                labels: regDates,
                datasets: [
                    {
                        label: 'Onsite',
                        data: regOnsite,
                        backgroundColor: '#6366f1', // Indigo
                        borderRadius: 4
                    },
                    {
                        label: 'Online',
                        data: regOnline,
                        backgroundColor: '#22d3ee', // Cyan
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Data for Visits Chart
        const visitDates = <?= json_encode($visitDates) ?>;
        const visitCounts = <?= json_encode($visitData) ?>;

        const visitCtx = document.getElementById('visitsChart').getContext('2d');
        new Chart(visitCtx, {
            type: 'bar',
            data: {
                labels: visitDates,
                datasets: [{
                    label: 'Unique Visits / Day',
                    data: visitCounts,
                    backgroundColor: '#10b981', // Emerald
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: function() {
                                return '1 person = max 1 visit mapped entirely to this specific day.';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
