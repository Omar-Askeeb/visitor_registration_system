<?php

namespace App\Models;

use App\Jobs\RegisterVisitorExternalJob;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Visitor extends Model
{
    protected $fillable = [
        'event_id',
        'creator_id',
        'formID',
        'badgeID',
        'onlineRegID',
        'visitorName',
        'midleName',
        'surName',
        'organisation',
        'email',
        'phone1',
        'has_whatsapp',
        'phone2',
        'gender',
        'nationality',
        'resident',
        'workfield',
        'howexpo',
        'print_count',
        'print_date',
        'printed_by',
        'fill_duration',
        'modifier',
        'modifyUnits',
        'insertUnits',
        'modifydate',
        'modifyCount',
        'is_verified',
        'verified_by_id',
        'verification_type',
        'verification_notes',
        'online_source',
        'visitor_source',
        'online_created_at',
        'external_sync_status',
        'external_sync_id',
        'external_sync_error',
        'email_send_status',
        'email_sent_at',
        'email_send_error',
    ];


    protected $casts = [
        'modifydate'  => 'datetime',
        'workfield'   => 'array',
        'howexpo'     => 'array',
        'is_verified' => 'boolean',
    ];

    /**
     * Dispatch the external CRM sync job when a new on-site visitor is created.
     * Skipped for: visitors pulled from CRM (onlineRegID set) and training events.
     */
    protected static function booted(): void
    {
        static::created(function (Visitor $visitor) {
            // Only skip visitors that were pulled from the CRM (they have onlineRegID set).
            // All other entries — on-site, other platforms — have onlineRegID = NULL and SHOULD be pushed.
            if ($visitor->onlineRegID) {
                return;
            }

            // Skip if the event is in training mode or has Push Sync disabled
            $event = $visitor->event; // Use relationship
            if (!$event || $event->is_training || !$event->sync_push_enabled) {
                return;
            }

            // Only push visitors with source 'onsite' or 'self-service'
            if ($visitor->visitor_source === 'online') {
                return;
            }

            RegisterVisitorExternalJob::dispatch($visitor);
            \App\Jobs\SendVisitorEmailJob::dispatch($visitor);
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function modifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modifier');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }

    public function printer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'printed_by');
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }


    /**
     * Encode the given value as JSON.
     *
     * @param  mixed  $value
     * @param  int  $flags
     * @return string
     */
    protected function asJson($value, $flags = 0)
    {
        return json_encode($value, $flags | JSON_UNESCAPED_UNICODE);
    }
}
