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
    public $incrementing = true;

    protected $fillable = [
        'organization_name',
        'organization_email',
        'city',
        'request_date',
        'closing_date',
        'rfq_number',
        'payment_type',
        'contact_number',
        'status_id',
        'warehouse_id',
        'requester_id',
        'category_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'attachments',
        'notes',
        'quotation_sent',
        'quotation_sent_at',
        'quotation_document',
        'excel_attachment',
        'payment_options'
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
        return $this->belongsToMany(
            ProductCategory::class, 
            'rfq_categories', 
            'rfq_id', 
            'category_id'
        )->withTimestamps();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
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
        return $this->hasMany(RfqItem::class, 'rfq_id');
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
        return $this->belongsTo(SubCostCenter::class, 'sub_cost_center_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'rfq_id');
    }
}