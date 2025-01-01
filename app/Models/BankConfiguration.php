<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankConfiguration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'bank_name',
        'bank_code',
        'branch_name',
        'branch_code',
        'account_number',
        'account_title',
        'iban',
        'swift_code',
        'routing_number',
        'currency_code',
        'is_default',
        'is_active',
        'api_settings',
        'company_id'
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'api_settings' => 'json'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
