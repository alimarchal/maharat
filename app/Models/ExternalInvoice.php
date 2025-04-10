<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalInvoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'purchase_order_id',
        'supplier_id',
        'invoice_id',
        'amount',
        'vat_amount',
        'status',
        'type',
        'payable_date'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'payable_date' => 'date',
    ];

    /**
     * Get the user who created the invoice.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the purchase order associated with the invoice.
     */
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id', 'id');
    }

    /**
     * Get the supplier associated with the invoice.
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the total amount (including VAT).
     */
    public function getTotalAmountAttribute()
    {
        return $this->amount + $this->vat_amount;
    }

    // Add this to ensure purchase order is always loaded
    protected $with = ['purchaseOrder'];
}
