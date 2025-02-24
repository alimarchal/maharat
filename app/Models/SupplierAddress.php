<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierAddress extends Model
{
    /** @use HasFactory<\Database\Factories\SupplierAddressFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'address_type',
        'street_address',
        'city',
        'state',
        'country',
        'postal_code'
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
