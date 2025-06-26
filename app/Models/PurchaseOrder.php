<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'purchase_order_no',
        'rfq_id',
        'warehouse_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'quotation_id',
        'supplier_id',
        'user_id',
        'purchase_order_date',
        'expiry_date',
        'amount',
        'vat_amount',
        'attachment',
        'original_name',
        'generated_document',
        'status',
        'fiscal_period_id',
        'request_budget_id'
    ];

    protected $casts = [
        'purchase_order_date' => 'date',
        'expiry_date' => 'date',
        'amount' => 'decimal:2',
        'vat_amount' => 'decimal:2'
    ];


    public function requestBudget(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class);
    }

    /**
     * Get the fiscal period associated with the purchase order.
     */
    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    /**
     * Get the quotation that owns the purchase order.
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * Get the supplier that owns the purchase order.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the user who created the purchase order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
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

    /**
     * Get the payment orders associated with this purchase order.
     */
    public function paymentOrders()
    {
        return $this->hasMany(PaymentOrder::class);
    }

    public function goodReceiveNote()
    {
        return $this->hasMany(Grn::class);
    }

    public function requestForQuotation(): BelongsTo
    {
        return $this->belongsTo(Rfq::class, 'rfq_id', 'id');
    }

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class, 'rfq_id', 'id');
    }

    public function externalInvoice()
    {
        return $this->hasOne(ExternalInvoice::class);
    }
}
