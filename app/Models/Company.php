<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;

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
        'zatca_environment',
    ];

    protected $casts = [
        'fiscal_year_start' => 'date',
        'fiscal_year_end' => 'date',
        'price_decimals' => 'decimal:2',
        'quantity_decimals' => 'decimal:2',
        'amount_decimals' => 'decimal:2',
        'gazt_amount_decimals' => 'decimal:2',
        'stop_login' => 'boolean',
        'loyalty_use_phone_as_card' => 'boolean',
    ];

    // Relationships - add as needed
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }
}
