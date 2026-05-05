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
        'role_id',
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

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function trainingRecords()
    {
        return $this->hasMany(\App\Models\TrainingRecord::class);
    }

    public function hasPermission(string $permission): bool
    {
        $role = $this->loadMissing('role')->role;
        if (!$role) {
            return false;
        }

        // Admin has all permissions bypass
        if ($role->name === 'admin') {
            return true;
        }

        return $role->permissions()->where('name', $permission)->exists();
    }
}
