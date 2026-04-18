<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'online_created_at',
    ];

    protected $casts = [
        'modifydate'  => 'datetime',
        'workfield'   => 'array',
        'howexpo'     => 'array',
        'is_verified' => 'boolean',
    ];

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
