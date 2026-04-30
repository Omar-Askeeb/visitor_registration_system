<?php
// index.php
require_once 'config.php';

// ─── Event Day Definitions ─────────────────────────────────────────────────
$eventDays = [
    1 => '2026-04-20',
    2 => '2026-04-21',
    3 => '2026-04-22',
    4 => '2026-04-23',
];
$eventDayLabels = ['Day 1 (Apr 20)', 'Day 2 (Apr 21)', 'Day 3 (Apr 22)', 'Day 4 (Apr 23)'];

// Get selected day filter (0 = all days)
$selectedDay = isset($_GET['day']) ? (int)$_GET['day'] : 0;
$filterDate  = ($selectedDay > 0 && isset($eventDays[$selectedDay])) ? $eventDays[$selectedDay] : null;

// ─── 1. Top Card Stats (with optional day filter) ──────────────────────────

if ($filterDate) {
    // Filtered: Onsite visitors who REGISTERED on that specific day
    $onsiteQ = $pdo->prepare("
        SELECT COUNT(*) FROM visitors
        WHERE onlineRegID IS NULL
          AND DATE(created_at) = ?
    ");
    $onsiteQ->execute([$filterDate]);
    $totalOnsite = (int)$onsiteQ->fetchColumn();

    // Filtered: Online visitors whose badge was PRINTED on that day
    $onlineQ = $pdo->prepare("
        SELECT COUNT(*) FROM visitors
        WHERE onlineRegID IS NOT NULL
          AND print_date IS NOT NULL
          AND print_count > 0
          AND DATE(print_date) = ?
    ");
    $onlineQ->execute([$filterDate]);
    $totalOnline = (int)$onlineQ->fetchColumn();

    // Filtered: Visits count (distinct barcodes scanned on that day)
    $visitsQ = $pdo->prepare("
        SELECT COUNT(DISTINCT barcode) FROM scans
        WHERE DATE(timestamp) = ?
    ");
    $visitsQ->execute([$filterDate]);
    $totalVisits = (int)$visitsQ->fetchColumn();

    // Filtered: Self Register App (printed_by = 4, 54, 55 on this day)
    $selfRegQ = $pdo->prepare("
        SELECT COUNT(*) FROM visitors
        WHERE printed_by IN (4, 54, 55)
          AND DATE(print_date) = ?
    ");
    $selfRegQ->execute([$filterDate]);
    $totalSelfRegister = (int)$selfRegQ->fetchColumn();

} else {
    // All days combined
    $statsQ = $pdo->query("
        SELECT
            SUM(CASE WHEN onlineRegID IS NULL THEN 1 ELSE 0 END) as onsite_visitors,
            SUM(CASE WHEN onlineRegID IS NOT NULL AND print_date IS NOT NULL AND print_count > 0 THEN 1 ELSE 0 END) as online_visitors,
            SUM(CASE WHEN printed_by IN (4, 54, 55) THEN 1 ELSE 0 END) as self_register
        FROM visitors
    ");
    $stats = $statsQ->fetch();
    $totalOnsite       = (int)$stats['onsite_visitors'];
    $totalOnline       = (int)$stats['online_visitors'];
    $totalSelfRegister = (int)$stats['self_register'];

    // All-time unique visits (distinct barcodes ever scanned)
    $visitsQ = $pdo->query("SELECT COUNT(DISTINCT barcode) FROM scans");
    $totalVisits = (int)$visitsQ->fetchColumn();
}

$totalVisitors = $totalOnsite + $totalOnline;

// ─── 2. Actual Visitors Per Day Chart ──────────────────────────────────────
$trendQuery = $pdo->query("
    SELECT reg_date,
           SUM(onsite_count) as onsite_count,
           SUM(online_count) as online_count
    FROM (
        SELECT DATE(created_at) as reg_date,
               COUNT(*) as onsite_count,
               0 as online_count
        FROM visitors
        WHERE onlineRegID IS NULL
          AND created_at IS NOT NULL
          AND DATE(created_at) BETWEEN '2026-04-19' AND '2026-04-23'
        GROUP BY DATE(created_at)

        UNION ALL

        SELECT DATE(print_date) as reg_date,
               0 as onsite_count,
               COUNT(*) as online_count
        FROM visitors
        WHERE onlineRegID IS NOT NULL
          AND print_date IS NOT NULL
          AND print_count > 0
          AND DATE(print_date) BETWEEN '2026-04-19' AND '2026-04-23'
        GROUP BY DATE(print_date)
    ) combined
    GROUP BY reg_date
");
$registrationTrend = $trendQuery->fetchAll();

$regDateList = ['2026-04-19', '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23'];
$regDataDict = array_fill_keys($regDateList, ['onsite' => 0, 'online' => 0]);

foreach ($registrationTrend as $row) {
    if (isset($regDataDict[$row['reg_date']])) {
        $regDataDict[$row['reg_date']]['onsite'] = (int)$row['onsite_count'];
        $regDataDict[$row['reg_date']]['online'] = (int)$row['online_count'];
    }
}

$regDates   = $regDateList;
$onsiteData = array_column($regDataDict, 'onsite');
$onlineData = array_column($regDataDict, 'online');

// ─── 3. Visits by Visit Number Chart (1st/2nd/3rd/4th visit) ──────────────
// A barcode's "visit number" on a given day = how many distinct days that barcode appeared
// BEFORE and INCLUDING that day.
// Strategy: for each day, count barcodes where their cumulative distinct-day count equals 1, 2, 3, or 4.

// Step A: build a table of (barcode, visit_day_number, date)
// For each scan date, compute rank = number of distinct dates this barcode has been seen up to & including this date.

$visitsByNumberQuery = $pdo->query("
    SELECT
        s.visit_date,
        s.visit_num,
        COUNT(*) as visit_count
    FROM (
        SELECT
            a.barcode,
            a.visit_date,
            COUNT(DISTINCT b.visit_date) AS visit_num
        FROM (
            SELECT barcode, DATE(timestamp) as visit_date
            FROM scans
            WHERE DATE(timestamp) BETWEEN '2026-04-20' AND '2026-04-23'
            GROUP BY barcode, DATE(timestamp)
        ) a
        JOIN (
            SELECT barcode, DATE(timestamp) as visit_date
            FROM scans
            WHERE DATE(timestamp) BETWEEN '2026-04-20' AND '2026-04-23'
            GROUP BY barcode, DATE(timestamp)
        ) b ON a.barcode = b.barcode AND b.visit_date <= a.visit_date
        GROUP BY a.barcode, a.visit_date
    ) s
    GROUP BY s.visit_date, s.visit_num
    ORDER BY s.visit_date, s.visit_num
");
$visitsByNumber = $visitsByNumberQuery->fetchAll();

$visitDates  = ['2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23'];
$visitNumData = [1 => [], 2 => [], 3 => [], 4 => []];
foreach ($visitDates as $d) {
    for ($n = 1; $n <= 4; $n++) $visitNumData[$n][$d] = 0;
}
foreach ($visitsByNumber as $row) {
    $d = $row['visit_date'];
    $n = (int)$row['visit_num'];
    if (isset($visitNumData[$n][$d])) {
        $visitNumData[$n][$d] = (int)$row['visit_count'];
    }
}
$visit1Data = array_values($visitNumData[1]);
$visit2Data = array_values($visitNumData[2]);
$visit3Data = array_values($visitNumData[3]);
$visit4Data = array_values($visitNumData[4]);

// ─── 4. Online Visitors Synced Per Day ────────────────────────────────────
$onlineSyncedPerDayQuery = $pdo->query("
    SELECT
        DATE(created_at) as sync_date,
        COUNT(*) as online_synced_today
    FROM visitors
    WHERE onlineRegID IS NOT NULL AND created_at IS NOT NULL
        AND DATE(created_at) BETWEEN '2026-04-19' AND '2026-04-23'
    GROUP BY DATE(created_at)
");
$onlineSyncedPerDay = $onlineSyncedPerDayQuery->fetchAll();

$syncDateList = ['2026-04-19', '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23'];
$syncDataDict = array_fill_keys($syncDateList, 0);

foreach ($onlineSyncedPerDay as $row) {
    if (isset($syncDataDict[$row['sync_date']])) {
        $syncDataDict[$row['sync_date']] = (int)$row['online_synced_today'];
    }
}

$onlineSyncDates = $syncDateList;
$onlineSyncData  = array_values($syncDataDict);

// Helper: build query-string for day filter links
function dayLink($day) {
    return '?day=' . $day;
}
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Statistics Dashboard</title>
    <script src="js/tailwind.js"></script>
    <script src="js/chart.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f0f4ff; }

        /* Day filter pill buttons */
        .day-pill {
            display: inline-flex;
            align-items: center;
            padding: 6px 18px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.18s ease;
            border: 2px solid transparent;
        }
        .day-pill.inactive {
            background: #fff;
            color: #6b7280;
            border-color: #e5e7eb;
        }
        .day-pill.inactive:hover {
            border-color: #6366f1;
            color: #6366f1;
        }
        .day-pill.active {
            background: #6366f1;
            color: #fff;
            border-color: #6366f1;
            box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }
        .day-pill.all.active {
            background: #0f172a;
            border-color: #0f172a;
            box-shadow: 0 4px 14px rgba(15,23,42,0.25);
        }

        /* Stat Card */
        .stat-card {
            background: #fff;
            border-radius: 20px;
            padding: 24px 28px;
            box-shadow: 0 2px 16px -4px rgba(80,80,180,0.10);
            border: 1.5px solid #e8eaf6;
            position: relative;
            overflow: hidden;
            transition: box-shadow 0.18s, transform 0.18s;
        }
        .stat-card:hover {
            box-shadow: 0 8px 32px -6px rgba(80,80,180,0.18);
            transform: translateY(-2px);
        }
        .stat-card .accent-bar {
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 5px;
            border-radius: 20px 0 0 20px;
        }
        .stat-card .label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 6px;
        }
        .stat-card .value {
            font-size: 38px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.1;
        }
        .stat-card .sub {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 8px;
            font-weight: 500;
            line-height: 1.5;
        }
        .stat-card .icon {
            position: absolute;
            right: 22px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 40px;
            opacity: 0.08;
        }

        /* Chart card */
        .chart-card {
            background: #fff;
            border-radius: 20px;
            padding: 24px 24px 20px;
            box-shadow: 0 2px 16px -4px rgba(80,80,180,0.08);
            border: 1.5px solid #e8eaf6;
        }

        .section-title {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 4px;
        }
        .section-sub {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 20px;
        }

        /* Filter badge showing which day is active */
        .filter-badge {
            display: inline-block;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 11px;
            font-weight: 700;
            border-radius: 9999px;
            padding: 3px 12px;
            margin-left: 10px;
            vertical-align: middle;
            letter-spacing: 0.06em;
        }
    </style>
</head>
<body class="antialiased p-6 md:p-10">

    <div class="max-w-7xl mx-auto space-y-10">

        <!-- Header -->
        <header class="flex flex-wrap justify-between items-end pb-5 border-b border-slate-200 gap-4">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Real-Time Event Dashboard</h1>
                <p class="text-slate-400 font-medium mt-1 text-sm">Live statistics reflecting synchronized database records.</p>
            </div>
            <div class="bg-cyan-50 flex items-center px-4 py-2 border border-cyan-100 rounded-full shadow-sm">
                <span class="relative flex h-2.5 w-2.5 mr-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span class="font-bold text-xs text-cyan-800 uppercase tracking-widest">Live Sync Active</span>
            </div>
        </header>

        <!-- Day Filter -->
        <div>
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Filter by Day:</span>

                <a href="?" class="day-pill all <?= $selectedDay === 0 ? 'active' : 'inactive' ?>">All Days</a>

                <?php foreach ($eventDays as $num => $date): ?>
                    <a href="<?= dayLink($num) ?>"
                       class="day-pill <?= $selectedDay === $num ? 'active' : 'inactive' ?>">
                        Day <?= $num ?>
                        <span style="font-weight:500;opacity:0.75;margin-left:5px;font-size:10px;">
                            <?= date('M j', strtotime($date)) ?>
                        </span>
                    </a>
                <?php endforeach; ?>
            </div>
            <?php if ($selectedDay > 0): ?>
                <div class="mt-3 text-xs text-slate-400">
                    Showing data for <strong class="text-indigo-600"><?= $eventDayLabels[$selectedDay - 1] ?></strong>
                </div>
            <?php endif; ?>
        </div>

        <!-- ═══ TOP CARDS ═══════════════════════════════════════════════════ -->
        <section>
            <div class="section-title">
                Visitor Overview
                <?php if ($selectedDay > 0): ?>
                    <span class="filter-badge"><?= $eventDayLabels[$selectedDay - 1] ?></span>
                <?php endif; ?>
            </div>
            <div class="section-sub">
                <?= $selectedDay > 0 ? 'Day-specific counts — Onsite registered on this day · Online who printed badge this day · Scans on this day.' : 'All-event totals — Onsite: registered on-site · Online: badge printed (arrived) · Visits: unique barcodes scanned.' ?>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">

                <!-- Total Visitors -->
                <div class="stat-card">
                    <div class="accent-bar" style="background: linear-gradient(180deg,#6366f1,#818cf8);"></div>
                    <div class="label">Total Visitors</div>
                    <div class="value"><?= number_format($totalVisitors) ?></div>
                    <div class="sub">Onsite + Online who physically attended<?= $selectedDay > 0 ? ' this day' : '' ?></div>
                    <div class="icon">👥</div>
                </div>

                <!-- Total Onsite -->
                <div class="stat-card">
                    <div class="accent-bar" style="background: linear-gradient(180deg,#8b5cf6,#a78bfa);"></div>
                    <div class="label">Total Onsite</div>
                    <div class="value"><?= number_format($totalOnsite) ?></div>
                    <div class="sub">Registered on-site<?= $selectedDay > 0 ? ' on this day' : ' during event days' ?></div>
                    <div class="icon">🏟️</div>
                </div>

                <!-- Total Online (Came) -->
                <div class="stat-card">
                    <div class="accent-bar" style="background: linear-gradient(180deg,#06b6d4,#22d3ee);"></div>
                    <div class="label">Total Online (Arrived)</div>
                    <div class="value"><?= number_format($totalOnline) ?></div>
                    <div class="sub">Pre-registered &amp; badge printed<?= $selectedDay > 0 ? ' on this day' : '' ?> (print_count &gt; 0)</div>
                    <div class="icon">🖨️</div>
                </div>

                <!-- Visits Count -->
                <div class="stat-card">
                    <div class="accent-bar" style="background: linear-gradient(180deg,#10b981,#34d399);"></div>
                    <div class="label">Visits <?= $selectedDay > 0 ? 'Today' : 'Count' ?></div>
                    <div class="value"><?= number_format($totalVisits) ?></div>
                    <div class="sub">Unique barcodes scanned<?= $selectedDay > 0 ? ' on this day' : ' (all days, deduplicated)' ?></div>
                    <div class="icon">📊</div>
                </div>

                <!-- Self Register App -->
                <div class="stat-card">
                    <div class="accent-bar" style="background: linear-gradient(180deg,#f59e0b,#fbbf24);"></div>
                    <div class="label">Self Reg App</div>
                    <div class="value"><?= number_format($totalSelfRegister) ?></div>
                    <div class="sub">Printed via Self Reg App (4, 54, 55)<?= $selectedDay > 0 ? ' today' : '' ?></div>
                    <div class="icon">📱</div>
                </div>

            </div>
        </section>

        <!-- ═══ CHARTS ═══════════════════════════════════════════════════════ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Chart 1: Actual Visitors per Day (Onsite + Online) -->
            <div class="chart-card">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Actual Visitors per Day</h3>
                <p class="text-[10px] text-slate-400 mb-4">Onsite = registered that day &bull; Online = badge printed that day</p>
                <div class="relative h-72">
                    <canvas id="regChart"></canvas>
                </div>
            </div>

            <!-- Chart 2: Visits by Visit Number (1st, 2nd, 3rd, 4th visit) -->
            <div class="chart-card">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Visits Per Day by Visit Number</h3>
                <p class="text-[10px] text-slate-400 mb-4">Each bar shows how many people were on their 1st, 2nd, 3rd, or 4th visit that day</p>
                <div class="relative h-72">
                    <canvas id="visitsChart"></canvas>
                </div>
            </div>

            <!-- Chart 3: Online Synced per Day -->
            <div class="chart-card">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Online Synced per Day</h3>
                <p class="text-[10px] text-slate-400 mb-4">Online pre-registrations added/synced each day</p>
                <div class="relative h-72">
                    <canvas id="onlineSyncedChart"></canvas>
                </div>
            </div>
        </div>

    </div><!-- /max-w -->

    <script>
        // ── Chart 1: Actual Visitors (Onsite + Online) ─────────────────────
        const regDates  = <?= json_encode($regDates) ?>;
        const regOnsite = <?= json_encode($onsiteData) ?>;
        const regOnline = <?= json_encode($onlineData) ?>;

        new Chart(document.getElementById('regChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: regDates,
                datasets: [
                    {
                        label: 'Onsite',
                        data: regOnsite,
                        backgroundColor: '#6366f1',
                        borderRadius: 5,
                        stack: 'visitors'
                    },
                    {
                        label: 'Online (Arrived)',
                        data: regOnline,
                        backgroundColor: '#22d3ee',
                        borderRadius: 5,
                        stack: 'visitors'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' } }
                },
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }
            }
        });

        // ── Chart 2: Visits by Visit Number ────────────────────────────────
        const visitDates  = <?= json_encode($visitDates) ?>;
        const visit1Data  = <?= json_encode($visit1Data) ?>;
        const visit2Data  = <?= json_encode($visit2Data) ?>;
        const visit3Data  = <?= json_encode($visit3Data) ?>;
        const visit4Data  = <?= json_encode($visit4Data) ?>;

        new Chart(document.getElementById('visitsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: visitDates,
                datasets: [
                    {
                        label: '1st Visit',
                        data: visit1Data,
                        backgroundColor: '#10b981',   // Emerald
                        borderRadius: 5,
                        stack: 'visits'
                    },
                    {
                        label: '2nd Visit',
                        data: visit2Data,
                        backgroundColor: '#f59e0b',   // Amber
                        borderRadius: 5,
                        stack: 'visits'
                    },
                    {
                        label: '3rd Visit',
                        data: visit3Data,
                        backgroundColor: '#ef4444',   // Red
                        borderRadius: 5,
                        stack: 'visits'
                    },
                    {
                        label: '4th Visit',
                        data: visit4Data,
                        backgroundColor: '#8b5cf6',   // Violet
                        borderRadius: 5,
                        stack: 'visits'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' } }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(ctx) {
                                const totalArr = [visit1Data, visit2Data, visit3Data, visit4Data];
                                const total = totalArr.reduce((s, a) => s + (a[ctx.dataIndex] || 0), 0);
                                const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                                return `${pct}% of that day's visitors`;
                            }
                        }
                    }
                }
            }
        });

        // ── Chart 3: Online Synced per Day ─────────────────────────────────
        const onlineSyncDates = <?= json_encode($onlineSyncDates) ?>;
        const onlineSyncData  = <?= json_encode($onlineSyncData) ?>;

        new Chart(document.getElementById('onlineSyncedChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: onlineSyncDates,
                datasets: [{
                    label: 'Online Added / Synced',
                    data: onlineSyncData,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    </script>
</body>
</html>
