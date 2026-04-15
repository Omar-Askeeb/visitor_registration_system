<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'name',
        'location',
        'start_date',
        'end_date',
        'duration',
        'badge_id_prefix',
        'form_id_prefix',
        'online_reg_prefix',
        'target_visitors',
        'status',
        'notes',
        'online_slug',
        'sync_enabled',
        'sync_url',
        'sync_interval',
        'sync_countdown',
        'workfield_options',
        'howexpo_options',
    ];

    protected $casts = [
        'start_date'        => 'date',
        'end_date'          => 'date',
        'sync_enabled'      => 'boolean',
        'workfield_options' => 'array',
        'howexpo_options'   => 'array',
    ];

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SyncLog::class);
    }

    public function visitors(): HasMany
    {
        return $this->hasMany(Visitor::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }

    /**
     * Get visitor count for this event.
     */
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
