<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scan extends Model
{
    protected $fillable = [
        'barcode',
        'timestamp',
        'gate_details',
        'user_data',
        'event_id',
        'flag',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
