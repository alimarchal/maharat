<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceConfiguration extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'device_name',
        'device_type',
        'serial_number',
        'model_number',
        'manufacturer',
        'firmware_version',
        'connection_type',
        'ip_address',
        'port_number',
        'is_active',
        'last_sync_at',
        'settings',
        'company_id',
        'branch_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'json',
        'last_sync_at' => 'datetime'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
