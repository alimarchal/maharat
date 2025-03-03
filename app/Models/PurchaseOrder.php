<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'purchase_order_no',
        'quotation_id',
        'supplier_id',
        'user_id',
        'purchase_order_date',
        'amount',
        'attachment',
        'status'
    ];

    protected $casts = [
        'purchase_order_date' => 'date',
        'amount' => 'decimal:2'
    ];

    /**
     * Get the quotation that owns the purchase order.
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the supplier that owns the purchase order.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the user who created the purchase order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
