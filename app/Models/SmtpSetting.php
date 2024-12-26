<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmtpSetting extends Model
{
    /** @use HasFactory<\Database\Factories\SmtpSettingFactory> */
    use HasFactory;

    protected $fillable = [
        'email_address',
        'full_name',
        'host_name',
        'port_number',
        'username',
        'password',
        'enable_ssl',
        'company_id'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'enable_ssl' => 'boolean'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
