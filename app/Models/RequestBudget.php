<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestBudget extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'fiscal_period_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center',
        'previous_year_budget_amount',
        'requested_amount',
        'previous_year_revenue',
        'current_year_revenue',
        'approved_amount',
        'reserved_amount',
        'consumed_amount',
        'balance_amount',
        'urgency',
        'attachment_path',
        'reason_for_increase',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'previous_year_budget_amount' => 'decimal:2',
        'requested_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'consumed_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
    ];


    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // When a request budget is created or approved, initialize balance_amount
        static::saved(function ($requestBudget) {
            // If approved_amount is set and balance_amount is 0, initialize balance_amount
            if ($requestBudget->approved_amount > 0 && $requestBudget->balance_amount == 0) {
                $requestBudget->balance_amount = $requestBudget->approved_amount;
                $requestBudget->save();
            }
        });
    }

    /**
     * Reserve budget amount for a purchase order
     *
     * @param float $amount Amount to reserve
     * @return bool Whether reservation was successful
     */
    public function reserveBudget($amount)
    {
        // Check if there's enough balance
        if ($this->balance_amount >= $amount) {
            $this->reserved_amount += $amount;
            $this->balance_amount -= $amount;
            return $this->save();
        }

        return false;
    }

    /**
     * Release reserved budget amount (when a PO is canceled)
     *
     * @param float $amount Amount to release from reservation
     * @return bool
     */
    public function releaseReservedBudget($amount)
    {
        if ($this->reserved_amount >= $amount) {
            $this->reserved_amount -= $amount;
            $this->balance_amount += $amount;
            return $this->save();
        }

        return false;
    }

    /**
     * Consume budget from reserved amount (when payment is made)
     *
     * @param float $amount Amount to consume
     * @return bool
     */
    public function consumeBudget($amount)
    {
        if ($this->reserved_amount >= $amount) {
            $this->reserved_amount -= $amount;
            $this->consumed_amount += $amount;
            return $this->save();
        }

        return false;
    }

    /**
     * Get the fiscal period that owns the request budget.
     */
    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    /**
     * Get the department that owns the request budget.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the cost center that owns the request budget.
     */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    /**
     * Get the sub cost center that owns the request budget.
     */
    public function subCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'sub_cost_center');
    }

    /**
     * Get the user who created the request budget.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who updated the request budget.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
