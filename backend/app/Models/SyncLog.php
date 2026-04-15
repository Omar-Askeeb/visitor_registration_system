<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncLog extends Model
{
    protected $fillable = [
        'event_id',
        'status',
        'records_fetched',
        'records_added',
        'last_sync_date',
        'error_message',
    ];

    protected $casts = [
        'last_sync_date' => 'date',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
