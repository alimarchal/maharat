<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Grn extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'grn_number',
        'quotation_id',
        'purchase_order_id',
        'quantity',
        'delivery_date',
        'delivery_status',
        'adjustment_notes',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'quantity' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receiveGoods(): HasMany
    {
        return $this->hasMany(GrnReceiveGood::class);
    }

    public function externalDeliveryNote(): HasMany
    {
        return $this->hasMany(ExternalDeliveryNote::class);
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(PurchaseOrderAdjustment::class);
    }

    /**
     * Check if this GRN represents a complete delivery
     */
    public function isCompleteDelivery(): bool
    {
        return $this->delivery_status === 'complete_delivery';
    }

    /**
     * Check if this GRN represents a partial delivery with later expected
     */
    public function isLaterDelivery(): bool
    {
        return $this->delivery_status === 'later_delivery';
    }

    /**
     * Check if this GRN represents an adjusted order
     */
    public function isAdjustedOrder(): bool
    {
        return $this->delivery_status === 'adjust_order';
    }
}
