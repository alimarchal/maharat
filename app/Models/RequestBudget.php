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
    ];

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
