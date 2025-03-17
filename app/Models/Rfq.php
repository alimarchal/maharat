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

    protected $table = 'rfqs';

    protected $primaryKey = 'id';
    public $incrementing = false;

    protected $fillable = [
        'rfq_number',
        'payment_type',
        'organization_name',
        'organization_email',
        'city',
        'contact_number',
        'request_date',
        'expected_delivery_date',
        'closing_date',
        'attachments',
        'notes',
        'quotation_sent',
        'quotation_sent_at',
        'quotation_document',
        'status_id',
        'supplier_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
    ];

    protected $casts = [
        'request_date' => 'date',
        'expected_delivery_date' => 'date',
        'closing_date' => 'date',
        'quotation_sent' => 'boolean',
        'quotation_sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
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
        return $this->belongsTo(Status::class);
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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'rfq_id', 'id');
    }


    /**
     * Get the department associated with the material request.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the primary cost center associated with the material request.
     */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'cost_center_id');
    }

    /**
     * Get the secondary cost center associated with the material request.
     */
    public function subCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'sub_cost_center_id');
    }
}
