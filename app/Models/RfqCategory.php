<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;


class RfqCategory  extends Pivot
{
    /** @use HasFactory<\Database\Factories\RfqCategoryFactory> */
    use HasFactory;
    protected $table = 'rfq_categories';

    protected $fillable = [
        'rfq_id',
        'category_id',
    ];

    /**
     * Get the RFQ that owns the category.
     */
    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    /**
     * Get the category associated with the RFQ.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }
}
