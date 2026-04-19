<?php

// deeper diagnostic script
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Visitor;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

$ids = [1, 2, 32, 33, 34]; // Testing both known success and known fails
echo "Starting Deep Diagnostic for IDs: " . implode(', ', $ids) . "\n\n";

foreach ($ids as $id) {
    echo "--- ID: {$id} ---\n";
    $visitor = Visitor::find($id);
    if (!$visitor) {
        echo "NOT FOUND\n";
        continue;
    }

    // Manual payload construction mirroring the job
    $country = $visitor->nationality;
    $countryRow = DB::table('countries')->where('arabic_name', $country)->first();
    if ($countryRow && !empty($countryRow->english_name)) {
        $country = $countryRow->english_name;
    }

    $workfieldMap = [
        'العمارة'                     => 'Building & Construction Materials',
        'مواد البناء'                 => 'Building & Construction Materials',
        'الصناديق والمؤسسات المالية' => 'Real Estate',
        'ديكور داخلي'                 => 'Building & Construction Materials',
        'أعمال ميكانيكية'             => 'Building & Construction Materials',
        'عقارات'                      => 'Real Estate',
    ];

    $companySector = [];
    foreach ($visitor->workfield ?? [] as $localValue) {
        $mapped = $workfieldMap[$localValue] ?? null;
        if ($mapped && !in_array($mapped, $companySector, true)) {
            $companySector[] = $mapped;
        }
    }

    $salutation = $visitor->gender === 'أنثى' ? 'Ms.' : 'Mr.';

    $payload = [
        'eventId'        => 11,
        'email'          => $visitor->email ?? '',
        'salutation'     => $salutation,
        'first_name'     => $visitor->visitorName ?? '',
        'last_name'      => $visitor->surName ?? '',
        'company'        => $visitor->organisation ?? '',
        'phone'          => $visitor->phone1 ?? '',
        'mobile'         => $visitor->phone1 ?? '',
        'job'            => $visitor->organisation ?? '',
        'country'        => $country,
        'region'         => 'North Africa',
        'referredEmail'  => '',
        'companySector'  => $companySector,
        'howHeardAboutUs'=> $visitor->howexpo ?? [],
        'prefer_language'=> 'ar',
    ];

    echo "Payload: " . json_encode($payload, JSON_UNESCAPED_UNICODE) . "\n";

    try {
        $response = Http::asJson()
            ->withHeaders(['Accept' => 'application/json'])
            ->post('https://eventxcrm.com/api/register-visitor-onsite', $payload);

        echo "Result: HTTP " . $response->status() . "\n";
        echo "Body: " . $response->body() . "\n";
    } catch (\Exception $e) {
        echo "Exception: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
