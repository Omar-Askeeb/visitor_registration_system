<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingRecord extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'formID',
        'badgeID',
        'visitorName',
        'midleName',
        'surName',
        'organisation',
        'email',
        'phone1',
        'phone2',
        'gender',
        'nationality',
        'resident',
        'workfield',
        'howexpo',
        'fill_duration',
    ];

    protected $casts = [
        'workfield' => 'array',
        'howexpo'   => 'array',
        'fill_duration' => 'float',
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
