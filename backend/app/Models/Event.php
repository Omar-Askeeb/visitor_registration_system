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
        'workfield_options',
        'howexpo_options',
    ];

    protected $casts = [
        'start_date'        => 'date',
        'end_date'          => 'date',
        'workfield_options' => 'array',
        'howexpo_options'   => 'array',
    ];

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
    public function getVisitorCountAttribute(): int
    {
        return $this->visitors()->count();
    }
}
