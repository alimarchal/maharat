<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentOrderLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_order_id',
        'description',
        'action',
        'priority'
    ];

    /**
     * Get the payment order this log belongs to
     */
    public function paymentOrder(): BelongsTo
    {
        return $this->belongsTo(PaymentOrder::class);
    }
}
