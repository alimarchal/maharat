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
    use SoftDeletes;

    protected $fillable = [
        'rfq_number',
        'requester_id',
        'company_id',
        'warehouse_id',
        'organization_name',
        'organization_email',
        'city',
        'contact_number',
        'request_type',
        'payment_type',
        'request_date',
        'expected_delivery_date',
        'closing_date',
        'attachments',
        'notes',
        'status_id',
        'assigned_to',
        'rejection_reason',
        'quotation_document',
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
//    public function categories()
//    {
//        return $this->belongsToMany(ProductCategory::class, 'rfq_categories', 'rfq_id', 'category_id');
//    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function requestType(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'request_type');
    }

    public function paymentType(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'payment_type');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RfqItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(RfqStatusLog::class);
    }
}
