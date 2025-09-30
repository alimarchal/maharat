<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    protected $fillable = [
        'quotation_id',
        'rfq_item_id',
        'unit_price',
        'total_price',
        'vat_amount',
        'notes'
    ];

    protected $casts = [
        'unit_price' => 'decimal:4',
        'total_price' => 'decimal:4',
        'vat_amount' => 'decimal:4'
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function rfqItem(): BelongsTo
    {
        return $this->belongsTo(RfqItem::class);
    }
}
