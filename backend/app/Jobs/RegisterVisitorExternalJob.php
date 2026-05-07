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
    public int $tries = 1;

    /**
     * The visitor to push to the external API.
     */
    protected Visitor $visitor;

    /**
     * Workfield mapping: local Arabic value => external API English value.
     */
    protected array $workfieldMap = [
        // Libya Build
        'العمارة'                     => 'Building & Construction Materials',
        'مواد البناء'                 => 'Building & Construction Materials',
        'الصناديق والمؤسسات المالية' => 'Real Estate',
        'ديكور داخلي'                 => 'Building & Construction Materials',
        'أعمال ميكانيكية'             => 'Building & Construction Materials',
        'عقارات'                      => 'Real Estate',
        
        // Horeca
        'المشروبات والقهوة'            => 'Coffee & Tea',
        'خدمات الطعام / منتجات اللحوم'  => 'Food Services',
        'تجهيز الفنادق وأثاث المطاعم'  => 'Hospitality Equipment & Supplies',
        'التسويق الرقمي / نقاط البيع / مستلزمات' => 'Digital Marketing',
        'معدات المطابخ والتموين'       => 'Kitchen Equipment',
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
        $event = $this->visitor->event;
        if (!$event || !$event->sync_push_enabled || !$event->sync_push_url) {
            return;
        }

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
        $salutation = $this->visitor->gender === 'أنثى' ? 'Ms' : 'Mr';

        // --- Build payload ---
        $payload = [
            'salutation'      => $salutation,
            'first_name'      => $this->visitor->visitorName ?? '',
            'last_name'       => $this->visitor->surName ?? '',
            'company'         => $this->visitor->organisation ?? '',
            'phone'           => $this->visitor->phone1 ?? '',
            'mobile'          => $this->visitor->phone1 ?? '',
            'email'           => $this->visitor->email ?? '',
            'job'             => $this->visitor->organisation ?? '', // Map job to organization/company as in previous event
            'country'         => $country,
            'region'          => 'North Africa',
            'companySector'   => $companySector,
            'howHeardAboutUs' => $this->visitor->howexpo ?? [],
            'source'          => 'onsite',
            'prefer-language' => 'ar',
        ];

        // Add eventId only if it's NOT Horeca (Libya Build needs it)
        if ($event->id == 1) {
            $payload['eventId'] = 11;
        }

        // --- Call external API ---
        try {
            $response = Http::timeout(30)
                ->asJson()
                ->withHeaders(['Accept' => 'application/json'])
                ->post($event->sync_push_url, $payload);

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

                // Truncate message for activity log to ensure it fits in the database
                $logMsg = mb_substr($errorMsg, 0, 500);

                ActivityLog::create([
                    'user_id'     => $this->visitor->creator_id,
                    'action'      => 'external_crm_sync',
                    'description' => "❌ CRM Sync Failed: [{$this->visitor->formID}] HTTP {$response->status()} — {$logMsg}",
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
            // Mark as failed and log the error, but do NOT re-throw.
            // This prevents the job from being retried and blocking the queue.
            $this->failed($e);
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

        $logMsg = mb_substr($errorMsg, 0, 500);

        ActivityLog::create([
            'user_id'     => $this->visitor->creator_id,
            'action'      => 'external_crm_sync',
            'description' => "❌ CRM Sync Failed (Final): [{$this->visitor->formID}] — {$logMsg}",
            'ip_address'  => '127.0.0.1',
        ]);

        Log::error("RegisterVisitorExternalJob failed for visitor {$this->visitor->id}: {$errorMsg}");
    }
}
