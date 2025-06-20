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
        'urgency',
        'attachment_path',
        'original_name',
        'reason_for_increase',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'previous_year_budget_amount' => 'decimal:2',
        'requested_amount' => 'decimal:2',
        'revenue_planned' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'consumed_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
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
}
