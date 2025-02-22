<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierContact extends Model
{
    /** @use HasFactory<\Database\Factories\SupplierContactFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'supplier_id',
        'contact_name',
        'designation',
        'email',
        'phone',
        'is_primary'
    ];

    protected $casts = [
        'is_primary' => 'boolean'
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
