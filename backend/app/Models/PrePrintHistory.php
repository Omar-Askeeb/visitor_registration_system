<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrePrintHistory extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'type',
        'start_code',
        'end_code',
        'batch_size',
        'barcode_width',
        'barcode_height',
        'barcode_x',
        'barcode_y',
        'page_width',
        'page_height',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
