<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemAlertConfiguration extends Model
{
    /** @use HasFactory<\Database\Factories\SystemAlertConfigurationFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'frequency',
        'alert_rules',
        'is_active',
        'company_id'
    ];

    protected $casts = [
        'alert_rules' => 'json',
        'is_active' => 'boolean'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
