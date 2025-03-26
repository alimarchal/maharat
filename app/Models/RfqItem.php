<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfqItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rfq_id',
        'category_id',
        'product_id',
        'item_name',
        'description',
        'unit_id',
        'quantity',
        'brand_id',
        'model',
        'specifications',
        'attachment',
        'expected_delivery_date',
        'quoted_price',
        'negotiated_price',
        'status_id',
        'attachment',
        'original_filename'
    ];

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
