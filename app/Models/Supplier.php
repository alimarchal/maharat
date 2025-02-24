<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    /** @use HasFactory<\Database\Factories\SupplierFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'email',
        'phone',
        'website',
        'tax_number',
        'payment_terms',
        'is_approved',
        'currency_id',
        'status_id'
    ];

    protected $casts = [
        'is_approved' => 'boolean'
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(SupplierContact::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(SupplierAddress::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }
}
