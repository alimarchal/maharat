<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxRate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tax_group_id',
        'tax_group_name',
        'module',
        'type',
        'tax_percentage',
        'fixed_amount',
        'is_fixed_amount',
        'calculate_on',
        'is_enabled',
        'is_bundled_with_price',
        'company_id'
    ];

    protected $casts = [
        'tax_percentage' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'is_fixed_amount' => 'boolean',
        'is_enabled' => 'boolean',
        'is_bundled_with_price' => 'boolean'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function taxGroup()
    {
        return $this->belongsTo(TaxGroup::class);
    }
}
