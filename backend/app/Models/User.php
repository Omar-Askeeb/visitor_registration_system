<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    public function visitorsCreated()
    {
        return $this->hasMany(\App\Models\Visitor::class, 'creator_id');
    }

    public function visitorsModified()
    {
        return $this->hasMany(\App\Models\Visitor::class, 'modifier');
    }

    public function fixedRecords()
    {
        return $this->hasMany(\App\Models\Visitor::class, 'creator_id')->where('verification_type', 'fixed');
    }

    public function verifiedRecords()
    {
        return $this->hasMany(\App\Models\Visitor::class, 'verified_by_id');
    }
}
