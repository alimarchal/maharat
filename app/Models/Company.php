<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    // Company Model
    protected $fillable = [
        'name',
        'name_ar',
        'email',
        'contact_number',
        'fax',
        'country',
        'city',
        'states_provinces',
        'district',
        'postal_code',
        'street_name',
        'additional_street',
        'building_number',
        'additional_number',
        'short_address',
        'business_category',
        'id_type',
        'id_number',
        'logo_path',
        'stamp_path',
        'fiscal_year_start',
        'fiscal_year_end',
        'price_decimals',
        'quantity_decimals',
        'amount_decimals',
        'gazt_amount_decimals',
        'currency',
        'timezone',
        'session_expired_time',
        'stop_login',
        'loyalty_use_phone_as_card',
        'zatca_environment'
    ];

    protected $casts = [
        'fiscal_year_start' => 'date',
        'fiscal_year_end' => 'date',
        'stop_login' => 'boolean',
        'loyalty_use_phone_as_card' => 'boolean'
    ];
}
