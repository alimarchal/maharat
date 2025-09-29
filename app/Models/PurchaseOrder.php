<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'delivered_amount',
        'pending_amount',
        'attachment',
        'original_name',
        'generated_document',
        'status',
        'has_good_receive_note',
        'delivery_status',
        'fiscal_period_id',
        'request_budget_id'
    ];

    protected $casts = [
        'purchase_order_date' => 'date',
        'expiry_date' => 'date',
        'amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'delivered_amount' => 'decimal:2',
        'pending_amount' => 'decimal:2',
        'has_good_receive_note' => 'boolean'
    ];

    public function requestBudget(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class);
    }

    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'cost_center_id');
    }

    public function subCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'sub_cost_center_id');
    }

    public function paymentOrders(): HasMany
    {
        return $this->hasMany(PaymentOrder::class);
    }

    public function goodReceiveNote(): HasMany
    {
        return $this->hasMany(Grn::class);
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(PurchaseOrderAdjustment::class);
    }

    public function requestForQuotation(): BelongsTo
    {
        return $this->belongsTo(Rfq::class, 'rfq_id', 'id');
    }

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class, 'rfq_id', 'id');
    }

    public function externalInvoice(): HasMany
    {
        return $this->hasMany(ExternalInvoice::class);
    }

    /**
     * Update delivery status based on GRNs
     */
    public function updateDeliveryStatus()
    {
        $grns = $this->goodReceiveNote;
        
        if ($grns->isEmpty()) {
            $this->update([
                'delivery_status' => 'pending',
                'has_good_receive_note' => false
            ]);
            return;
        }

        // Calculate delivered amounts and quantities
        $totalDelivered = 0;
        $hasPartialDelivery = false;
        $hasCompleteDelivery = false;
        $hasAdjustment = false;

        foreach ($grns as $grn) {
            $totalDelivered += $grn->quantity;
            
            if ($grn->isLaterDelivery()) {
                $hasPartialDelivery = true;
            } elseif ($grn->isAdjustedOrder()) {
                $hasAdjustment = true;
            } elseif ($grn->isCompleteDelivery()) {
                $hasCompleteDelivery = true;
            }
        }

        // Determine status
        $status = 'pending';
        if ($hasAdjustment || $hasCompleteDelivery) {
            $status = ($hasPartialDelivery) ? 'partially_delivered' : 'completed';
        } elseif ($hasPartialDelivery) {
            $status = 'partially_delivered';
        } elseif ($totalDelivered > 0) {
            $status = 'delivered';
        }

        // Calculate amounts
        $deliveredAmount = $totalDelivered > 0 ? 
            ($this->amount * ($totalDelivered / $this->getTotalOrderedQuantity())) : 0;
        $pendingAmount = $this->amount - $deliveredAmount;

        $this->update([
            'delivery_status' => $status,
            'has_good_receive_note' => true,
            'delivered_amount' => $deliveredAmount,
            'pending_amount' => max(0, $pendingAmount)
        ]);
    }

    /**
     * Get total ordered quantity from RFQ items
     */
    protected function getTotalOrderedQuantity()
    {
        if ($this->rfq && $this->rfq->items) {
            return $this->rfq->items->sum('quantity');
        }
        return 1; // Fallback to prevent division by zero
    }

    /**
     * Check if purchase order is fully delivered
     */
    public function isFullyDelivered(): bool
    {
        return $this->delivery_status === 'completed';
    }

    /**
     * Check if purchase order has partial delivery
     */
    public function isPartiallyDelivered(): bool
    {
        return $this->delivery_status === 'partially_delivered';
    }

    /**
     * Check if purchase order is pending delivery
     */
    public function isPendingDelivery(): bool
    {
        return $this->delivery_status === 'pending';
    }
}
