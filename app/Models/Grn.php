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
}
