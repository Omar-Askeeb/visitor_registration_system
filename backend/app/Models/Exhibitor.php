<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exhibitor extends Model
{
    protected $fillable = [
        'event_id',
        'type',
        'nationality',
        'company_name_ar',
        'company_name_en',
        'hall_number',
        'stand_number',
        'number_of_badges',
        'receiver_name',
        'receiver_phone',
        'extra_badges',
        'number_of_vip_cards',
        'vip_cards_received',
        'badges_received',
        'badges_received_at',
        'employees',
        'is_printed',
        'printed_at',
        'printed_by',
        'barcode_id',
    ];

    protected $casts = [
        'employees'          => 'array',
        'badges_received'    => 'boolean',
        'vip_cards_received' => 'boolean',
        'is_printed'         => 'boolean',
        'badges_received_at' => 'datetime',
        'printed_at'         => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function printedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'printed_by');
    }
}
