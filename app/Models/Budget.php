<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\Rule;

class Budget extends Model
{
    use HasFactory, SoftDeletes, UserTracking;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'fiscal_period_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'request_budget_id',
        'description',
        'total_revenue_planned',
        'total_revenue_actual',
        'total_expense_planned',
        'total_expense_actual',
        'status',
        'attachment_path',
        'original_name',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_revenue_planned' => 'decimal:2',
        'total_revenue_actual' => 'decimal:2',
        'total_expense_planned' => 'decimal:2',
        'total_expense_actual' => 'decimal:2',
    ];

    /**
     * Get validation rules for creating a budget.
     */
    public static function getValidationRules($budgetId = null): array
    {
        return [
            'fiscal_period_id' => 'required|exists:fiscal_periods,id',
            'department_id' => 'nullable|exists:departments,id',
            'cost_center_id' => 'required|exists:cost_centers,id',
            'sub_cost_center_id' => 'nullable|exists:cost_centers,id',
            'description' => 'nullable|string|max:500',
            'total_revenue_planned' => 'required|numeric|min:0',
            'total_revenue_actual' => 'nullable|numeric|min:0',
            'total_expense_planned' => 'required|numeric|min:0',
            'total_expense_actual' => 'nullable|numeric|min:0',
            'status' => 'required|in:Pending,Active,Frozen,Closed',
        ];
    }

    /**
     * Get unique validation rules for preventing duplicates.
     */
    public static function getUniqueValidationRules($budgetId = null): array
    {
        $rules = self::getValidationRules($budgetId);
        
        $rules['fiscal_period_id'] = [
            'required',
            'exists:fiscal_periods,id',
            Rule::unique('budgets')->where(function ($query) use ($budgetId) {
                $query->where('cost_center_id', request('cost_center_id'))
                      ->where('sub_cost_center_id', request('sub_cost_center_id'));
                
                if ($budgetId) {
                    $query->where('id', '!=', $budgetId);
                }
            })->ignore($budgetId),
        ];

        return $rules;
    }

    /**
     * Check if a budget already exists for the given combination.
     */
    public static function existsForCombination($fiscalPeriodId, $costCenterId, $subCostCenterId, $excludeId = null): bool
    {
        $query = self::where('fiscal_period_id', $fiscalPeriodId)
                    ->where('cost_center_id', $costCenterId)
                    ->where('sub_cost_center_id', $subCostCenterId);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get the budget for a specific combination.
     */
    public static function getForCombination($fiscalPeriodId, $costCenterId, $subCostCenterId)
    {
        return self::where('fiscal_period_id', $fiscalPeriodId)
                  ->where('cost_center_id', $costCenterId)
                  ->where('sub_cost_center_id', $subCostCenterId)
                  ->first();
    }

    /**
     * Get the fiscal period that owns the budget.
     */
    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    /**
     * Get the department that owns the budget.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the cost center that owns the budget.
     */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function subCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class,'sub_cost_center_id','id');
    }

    /**
     * Get the user who created the budget.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the budget.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the request budget that created this budget.
     */
    public function requestBudget(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class);
    }

    /**
     * Get the budget approval transactions for this budget.
     */
    public function budgetApprovalTransactions(): HasMany
    {
        return $this->hasMany(BudgetApprovalTransaction::class);
    }
}
