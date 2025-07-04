<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationChannel extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'key', 'description', 'is_active'];

    public function userSettings()
    {
        return $this->hasMany(UserNotificationSetting::class);
    }
}
