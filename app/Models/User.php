<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, HasApiTokens, SoftDeletes;

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    protected $fillable = [
        'firstname',
        'designation',
        'lastname',
        'name',
        'email',
        'password',
        'landline',
        'mobile',
        'is_salesman_linked',
        'language',
        'attachment',
        'parent_id',
        'department_id', 
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}

