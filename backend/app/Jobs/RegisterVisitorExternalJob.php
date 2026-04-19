<?php

namespace App\Jobs;

use App\Models\Visitor;
use App\Models\ActivityLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RegisterVisitorExternalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Number of seconds to wait before retrying.
     */
    public array $backoff = [10, 30, 60];

    /**
     * The visitor to push to the external API.
     */
    protected Visitor $visitor;

    /**
     * Workfield mapping: local Arabic value => external API English value.
     */
    protected array $workfieldMap = [
        'العمارة'                     => 'Building & Construction Materials',
        'مواد البناء'                 => 'Building & Construction Materials',
        'الصناديق والمؤسسات المالية' => 'Real Estate',
        'ديكور داخلي'                 => 'Building & Construction Materials',
        'أعمال ميكانيكية'             => 'Building & Construction Materials',
        'عقارات'                      => 'Real Estate',
    ];

    /**
     * Create a new job instance.
     */
    public function __construct(Visitor $visitor)
    {
        $this->visitor = $visitor;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Only mark as pending and clear old errors on the first attempt
        if ($this->attempts() <= 1) {
            $this->visitor->update([
                'external_sync_status' => 'pending',
                'external_sync_error'  => null
            ]);
        }

        // --- Build companySector mapping ---
        $companySector = [];
        foreach ($this->visitor->workfield ?? [] as $localValue) {
            $mapped = $this->workfieldMap[$localValue] ?? null;
            if ($mapped && !in_array($mapped, $companySector, true)) {
                $companySector[] = $mapped;
            }
        }

        // --- Lookup country English name ---
        $country = $this->visitor->nationality;
        $countryRow = DB::table('countries')
            ->where('arabic_name', $country)
            ->first();
        if ($countryRow && !empty($countryRow->english_name)) {
            $country = $countryRow->english_name;
        }

        // --- Build salutation ---
        $salutation = $this->visitor->gender === 'أنثى' ? 'Ms.' : 'Mr.';

        // --- Build payload ---
        $payload = [
            'eventId'        => 11,
            'email'          => $this->visitor->email ?? '',
            'salutation'     => $salutation,
            'first_name'     => $this->visitor->visitorName ?? '',
            'last_name'      => $this->visitor->surName ?? '',
            'company'        => $this->visitor->organisation ?? '',
            'phone'          => $this->visitor->phone1 ?? '',
            'mobile'         => $this->visitor->phone1 ?? '',
            'job'            => $this->visitor->organisation ?? '',
            'country'        => $country,
            'region'         => 'North Africa',
            'referredEmail'  => '',
            'companySector'  => $companySector,
            'howHeardAboutUs'=> $this->visitor->howexpo ?? [],
            'prefer_language'=> 'ar',
        ];

        // --- Call external API — JSON body, 3 retries ---
        try {
            $response = Http::retry(3, 1000)
                ->timeout(15)
                ->asJson()
                ->withHeaders(['Accept' => 'application/json'])
                ->post('https://eventxcrm.com/api/register-visitor-onsite', $payload);

            $responseBody = $response->json();

            if ($response->successful()) {
                $externalId = $responseBody['id'] ?? ($responseBody['data']['id'] ?? null);

                $this->visitor->update([
                    'external_sync_status' => 'success',
                    'external_sync_id'     => $externalId ? (string) $externalId : null,
                    'external_sync_error'  => null,
                ]);

                ActivityLog::create([
                    'user_id'     => $this->visitor->creator_id,
                    'action'      => 'external_crm_sync',
                    'description' => "✅ CRM Sync Success: [{$this->visitor->formID}] {$this->visitor->visitorName} {$this->visitor->surName}" .
                                     ($externalId ? " (External ID: {$externalId})" : ''),
                    'ip_address'  => '127.0.0.1',
                ]);

            } else {
                $errorMsg = is_array($responseBody)
                    ? json_encode($responseBody, JSON_UNESCAPED_UNICODE)
                    : $response->body();

                // Mark as failed and save the error message
                $this->visitor->update([
                    'external_sync_status' => 'failed',
                    'external_sync_error'  => "HTTP {$response->status()}: {$errorMsg}",
                ]);

                ActivityLog::create([
                    'user_id'     => $this->visitor->creator_id,
                    'action'      => 'external_crm_sync',
                    'description' => "❌ CRM Sync Failed: [{$this->visitor->formID}] HTTP {$response->status()} — {$errorMsg}",
                    'ip_address'  => '127.0.0.1',
                ]);

                // If it's a permanent validation error (400 or 422), stop here.
                // Do NOT throw an exception, so we don't waste retries on bad data.
                if ($response->status() === 400 || $response->status() === 422) {
                    return; 
                }

                // For other errors (5xx server errors, etc.), throw to trigger retry
                throw new \Exception("External API returned HTTP {$response->status()}: {$errorMsg}");
            }

        } catch (\Exception $e) {
            // Re-throw so the queue worker can retry via $tries / $backoff
            throw $e;
        }
    }

    /**
     * Handle a job failure after all retries are exhausted.
     */
    public function failed(\Throwable $exception): void
    {
        $errorMsg = $exception->getMessage();

        $this->visitor->update([
            'external_sync_status' => 'failed',
            'external_sync_error'  => "All retries exhausted: {$errorMsg}",
        ]);

        ActivityLog::create([
            'user_id'     => $this->visitor->creator_id,
            'action'      => 'external_crm_sync',
            'description' => "❌ CRM Sync Failed (Final): [{$this->visitor->formID}] — {$errorMsg}",
            'ip_address'  => '127.0.0.1',
        ]);

        Log::error("RegisterVisitorExternalJob failed for visitor {$this->visitor->id}: {$errorMsg}");
    }
}
