<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPermissionOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'permission_name',
        'is_enabled',
        'overrides_role'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'overrides_role' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
