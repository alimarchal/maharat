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
        'revenue_planned',
        'previous_year_revenue',
        'current_year_revenue',
        'approved_amount',
        'reserved_amount',
        'consumed_amount',
        'balance_amount',
        'old_balance',
        'reallocate_amount',
        'reallocate_to_sub_cost_center',
        'destination_old_balance',
        'type',
        'urgency',
        'attachment_path',
        'original_name',
        'reason_for_increase',
        'status',
        'created_by',
        'updated_by',
        'purchase_order_id',
        'sub_cost_center_updated',
        'original_destination_sub_cost_center',
        'updated_destination_sub_cost_center',
        'updated_by_user_id',
        'available_alternatives_json',
    ];

    protected $casts = [
        'previous_year_budget_amount' => 'decimal:2',
        'requested_amount' => 'decimal:2',
        'revenue_planned' => 'decimal:2',
        'previous_year_revenue' => 'decimal:2',
        'current_year_revenue' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'consumed_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'old_balance' => 'decimal:2',
        'reallocate_amount' => 'decimal:2',
        'destination_old_balance' => 'decimal:2',
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
     * Get the destination sub cost center for reallocation.
     */
    public function reallocateToSubCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'reallocate_to_sub_cost_center');
    }

    /**
     * Get the purchase order associated with this reallocation request.
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the original destination sub cost center.
     */
    public function originalDestinationSubCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'original_destination_sub_cost_center');
    }

    /**
     * Get the updated destination sub cost center.
     */
    public function updatedDestinationSubCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'updated_destination_sub_cost_center');
    }

    /**
     * Get the user who updated the destination sub cost center.
     */
    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    /**
     * Get the reallocation history record for this reallocation request.
     */
    public function reallocationHistory()
    {
        return $this->hasOne(BudgetReallocationHistory::class, 'reallocation_request_id');
    }

    /**
     * Get the source budget request (approved budget for the source sub cost center).
     */
    public function sourceBudgetRequest()
    {
        return $this->hasOne(RequestBudget::class, 'sub_cost_center', 'sub_cost_center')
            ->whereColumn('request_budgets.fiscal_period_id', 'request_budgets.fiscal_period_id')
            ->whereColumn('request_budgets.department_id', 'request_budgets.department_id')
            ->whereColumn('request_budgets.cost_center_id', 'request_budgets.cost_center_id')
            ->where('request_budgets.status', 'Approved')
            ->where('request_budgets.type', '!=', 'reallocation'); // Exclude reallocation requests
    }

    /**
     * Get the user who created the request budget.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who created the request budget.
     */
    public function createdBy(): BelongsTo
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

    /**
     * Get the user who updated the request budget (alias for consistency).
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope to get only approved budget requests.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }

    /**
     * Scope to filter by cost center.
     */
    public function scopeForCostCenter($query, $costCenterId)
    {
        return $query->where('cost_center_id', $costCenterId);
    }

    /**
     * Scope to filter by sub cost center.
     */
    public function scopeForSubCostCenter($query, $subCostCenterId)
    {
        return $query->where('sub_cost_center', $subCostCenterId);
    }

    /**
     * Scope to filter by fiscal period.
     */
    public function scopeForFiscalPeriod($query, $fiscalPeriodId)
    {
        return $query->where('fiscal_period_id', $fiscalPeriodId);
    }

    /**
     * Scope to filter by department.
     */
    public function scopeForDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get total expenses (consumed amount) for multiple sub cost centers.
     */
    public static function getTotalExpensesForSubCostCenters(array $subCostCenterIds, $status = 'Approved')
    {
        return self::whereIn('sub_cost_center', $subCostCenterIds)
            ->where('status', $status)
            ->sum('consumed_amount') ?? 0;
    }

    /**
     * Get total balance for multiple sub cost centers.
     */
    public static function getTotalBalanceForSubCostCenters(array $subCostCenterIds, $status = 'Approved')
    {
        return self::whereIn('sub_cost_center', $subCostCenterIds)
            ->where('status', $status)
            ->sum('balance_amount') ?? 0;
    }

    /**
     * Get total expenses (consumed amount) for a single sub cost center.
     */
    public static function getExpensesForSubCostCenter($subCostCenterId, $status = 'Approved')
    {
        return self::where('sub_cost_center', $subCostCenterId)
            ->where('status', $status)
            ->sum('consumed_amount') ?? 0;
    }

    /**
     * Get total balance for a single sub cost center.
     */
    public static function getBalanceForSubCostCenter($subCostCenterId, $status = 'Approved')
    {
        return self::where('sub_cost_center', $subCostCenterId)
            ->where('status', $status)
            ->sum('balance_amount') ?? 0;
    }

    /**
     * Check if a budget request already exists for the given hierarchical combination
     */
    public static function checkHierarchicalUniqueness($fiscalPeriodId, $departmentId, $costCenterId, $subCostCenter, $excludeId = null)
    {
        $query = self::where('fiscal_period_id', $fiscalPeriodId)
            ->where('department_id', $departmentId)
            ->where('cost_center_id', $costCenterId);

        if ($subCostCenter) {
            // Ensure proper type conversion for sub_cost_center
            $subCostCenterId = is_numeric($subCostCenter) ? (int)$subCostCenter : $subCostCenter;
            $query->where('sub_cost_center', $subCostCenterId);
        }

        if ($excludeId) {
            // Ensure proper type conversion for exclude ID
            $excludeId = is_numeric($excludeId) ? (int)$excludeId : $excludeId;
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get the hierarchical uniqueness error message
     */
    public static function getHierarchicalUniquenessMessage($fiscalPeriodId, $departmentId, $costCenterId, $subCostCenter)
    {
        $existingRequest = self::where('fiscal_period_id', $fiscalPeriodId)
            ->where('department_id', $departmentId)
            ->where('cost_center_id', $costCenterId)
            ->when($subCostCenter, function($query) use ($subCostCenter) {
                return $query->where('sub_cost_center', $subCostCenter);
            })
            ->first();

        if ($existingRequest) {
            $fiscalPeriod = $existingRequest->fiscalPeriod;
            $department = $existingRequest->department;
            $costCenter = $existingRequest->costCenter;
            $subCostCenterDetails = $existingRequest->subCostCenter;

            $details = [];
            if ($fiscalPeriod) $details[] = "Fiscal Year: {$fiscalPeriod->fiscal_year}";
            if ($department) $details[] = "Department: {$department->name}";
            if ($costCenter) $details[] = "Cost Center: {$costCenter->name}";
            if ($subCostCenterDetails) $details[] = "Sub Cost Center: {$subCostCenterDetails->name}";

            return "Budget request already exists for " . implode(', ', $details);
        }

        return "Budget request already exists for this combination of fiscal year, department, cost center, and sub cost center.";
    }

    /**
     * Calculate the remaining budget (approved - consumed)
     */
    public function getRemainingBudgetAttribute()
    {
        return $this->approved_amount - $this->consumed_amount;
    }

    /**
     * Calculate the budget utilization percentage
     */
    public function getBudgetUtilizationAttribute()
    {
        if ($this->approved_amount <= 0) {
            return 0;
        }
        
        return round(($this->consumed_amount / $this->approved_amount) * 100, 2);
    }

    /**
     * Check if budget is over-utilized
     */
    public function isOverBudget()
    {
        return $this->consumed_amount > $this->approved_amount;
    }

    /**
     * Check if budget is nearly exhausted (90% utilized)
     */
    public function isNearlyExhausted($threshold = 90)
    {
        return $this->getBudgetUtilizationAttribute() >= $threshold;
    }
}
