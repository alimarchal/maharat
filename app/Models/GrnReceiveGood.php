<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GrnReceiveGood extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'grn_id',
        'supplier_id',
        'purchase_order_id',
        'quotation_id',
        'quantity_quoted',
        'due_delivery_date',
        'receiver_name',
        'upc',
        'category_id',
        'quantity_delivered',
        'delivery_date',
    ];

    protected $casts = [
        'due_delivery_date' => 'date',
        'delivery_date' => 'date',
        'quantity_quoted' => 'decimal:2',
        'quantity_delivered' => 'decimal:2',
    ];

    public function grn(): BelongsTo
    {
        return $this->belongsTo(Grn::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }
}
