<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rfq extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rfq_number',
        'category_id',
        'warehouse_id',
        'issue_date',
        'closing_date',
        'payment_type',
        'contact_number',
        'status_id',
        'terms_and_conditions',
        'notes'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'closing_date' => 'date'
    ];

    /**
     * Get the categories for the RFQ.
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(ProductCategory::class, 'rfq_categories', 'rfq_id', 'category_id')
            ->using(RfqCategory::class)
            ->withTimestamps();
    }

    public function category()
    {
        return $this->belongsTo(RfqCategory::class, 'category_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(RfqItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(RfqStatusLog::class);
    }
}
