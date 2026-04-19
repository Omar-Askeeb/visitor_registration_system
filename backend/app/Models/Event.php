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
        'remote_db_host',
        'remote_db_name',
        'remote_db_user',
        'remote_db_pass',
        'workfield_options',
        'howexpo_options',
        'is_training',
        'badge_layout',
        'email_enabled',
        'email_subject',
        'email_body',
        'email_from_name',
    ];

    protected $casts = [
        'start_date'        => 'date',
        'end_date'          => 'date',
        'sync_enabled'      => 'boolean',
        'workfield_options' => 'array',
        'howexpo_options'   => 'array',
        'is_training'       => 'boolean',
        'badge_layout'      => 'array',
        'email_enabled'     => 'boolean',
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

    public function mediaAgents(): HasMany
    {
        return $this->hasMany(MediaAgent::class);
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
