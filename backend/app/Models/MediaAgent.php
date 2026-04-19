<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaAgent extends Model
{
    protected $fillable = [
        'event_id',
        'badgeID',
        'first_name',
        'last_name',
        'position',
        'organisation',
        'email',
        'phone1',
        'has_whatsapp',
        'phone2',
        'gender',
        'nationality',
        'resident',
        'print_count',
    ];

    protected $casts = [
        'has_whatsapp' => 'boolean',
        'print_count'  => 'integer',
        'created_at'   => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function incrementPrintCount(): void
    {
        $this->increment('print_count');
    }
}
