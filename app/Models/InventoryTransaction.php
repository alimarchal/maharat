<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{

    protected $fillable = [
        'inventory_id',
        'transaction_type',
        'quantity',
        'previous_quantity',
        'new_quantity',
        'user_id',
        'reference_type',
        'reference_id',
        'reference_number',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'previous_quantity' => 'decimal:4',
        'new_quantity' => 'decimal:4',
    ];

    /**
     * Get the inventory that owns the transaction.
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }

    /**
     * Get the user that created the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


    public function reference() {
        return $this->morphTo();
    }

    public function product() {
        return $this->belongsTo(Product::class);
    }

    public function warehouse() {
        return $this->belongsTo(Warehouse::class);
    }
}
