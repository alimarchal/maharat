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
        'expected_quantity',
        'delivery_status',
        'delivery_notes',
        'delivery_date',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'quantity' => 'decimal:2',
        'expected_quantity' => 'decimal:2',
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

    /**
     * Check if this GRN is a partial delivery
     */
    public function isPartialDelivery()
    {
        return $this->delivery_status === 'partial' || $this->delivery_status === 'awaiting_remaining';
    }

    /**
     * Check if this GRN is awaiting remaining delivery
     */
    public function isAwaitingRemaining()
    {
        return $this->delivery_status === 'awaiting_remaining';
    }

    /**
     * Calculate the shortage quantity
     */
    public function getShortageQuantity()
    {
        if (!$this->expected_quantity) {
            return 0;
        }
        return max(0, $this->expected_quantity - $this->quantity);
    }

    /**
     * Calculate the shortage percentage
     */
    public function getShortagePercentage()
    {
        if (!$this->expected_quantity || $this->expected_quantity == 0) {
            return 0;
        }
        return round(($this->getShortageQuantity() / $this->expected_quantity) * 100, 2);
    }
}
