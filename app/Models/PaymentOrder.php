<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'purchase_order_id',
        'cost_center_id',
        'sub_cost_center_id',
        'payment_order_number',
        'issue_date',
        'due_date',
        'payment_type',
        'attachment',
        'uploaded_attachment',
        'total_amount',
        'paid_amount',
        'status'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date'
    ];

    /**
     * Get the user who created the payment order
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the purchase order this payment order belongs to
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the logs for this payment order
     */
    public function logs(): HasMany
    {
        return $this->hasMany(PaymentOrderLog::class);
    }
}
