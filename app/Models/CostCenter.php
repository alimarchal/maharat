<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CostCenter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'department_id',
        'code',
        'name',
        'cost_center_type',
        'description',
        'status',
        'effective_start_date',
        'effective_end_date',
        'manager_id',
        'budget_owner_id',
        'created_by',
        'updated_by',
        'is_active'
    ];

    protected $casts = [
        'effective_start_date' => 'date',
        'effective_end_date' => 'date',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(CostCenter::class, 'parent_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function budgetOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'budget_owner_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function subCostCenters(): HasMany
    {
        return $this->hasMany(SubCostCenter::class);
    }

    public function rfqs(): HasMany
    {
        return $this->hasMany(Rfq::class, 'cost_center_id');
    }

    // Budget requests relationships
    public function budgetRequests(): HasMany
    {
        return $this->hasMany(RequestBudget::class, 'cost_center_id');
    }

    public function subCostCenterBudgetRequests(): HasMany
    {
        return $this->hasMany(RequestBudget::class, 'sub_cost_center');
    }

    // Accessor for total expenses (consumed_amount)
    public function getTotalExpensesAttribute()
    {
        if ($this->parent_id === null) {
            // This is a main cost center, sum from sub cost centers
            return $this->children()
                ->with('subCostCenterBudgetRequests')
                ->get()
                ->sum(function ($child) {
                    return $child->subCostCenterBudgetRequests->sum('consumed_amount');
                });
        } else {
            // This is a sub cost center, get direct expenses
            return $this->subCostCenterBudgetRequests->sum('consumed_amount');
        }
    }

    // Accessor for total balance
    public function getTotalBalanceAttribute()
    {
        if ($this->parent_id === null) {
            // This is a main cost center, sum from sub cost centers
            return $this->children()
                ->with('subCostCenterBudgetRequests')
                ->get()
                ->sum(function ($child) {
                    return $child->subCostCenterBudgetRequests->sum('balance_amount');
                });
        } else {
            // This is a sub cost center, get direct balance
            return $this->subCostCenterBudgetRequests->sum('balance_amount');
        }
    }

    // Query scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'Approved');
    }

    public function scopeWithEffectiveDate($query, $date = null)
    {
        $date = $date ?? now()->toDateString();
        return $query->where('effective_start_date', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_end_date')
                    ->orWhere('effective_end_date', '>=', $date);
            });
    }

    public function scopeWithBudgetTotals($query)
    {
        return $query->withSum(['budgetRequests as direct_expenses' => function ($query) {
            $query->where('status', 'Approved');
        }], 'consumed_amount')
        ->withSum(['budgetRequests as direct_balance' => function ($query) {
            $query->where('status', 'Approved');
        }], 'balance_amount')
        ->withSum(['subCostCenterBudgetRequests as sub_expenses' => function ($query) {
            $query->where('status', 'Approved');
        }], 'consumed_amount')
        ->withSum(['subCostCenterBudgetRequests as sub_balance' => function ($query) {
            $query->where('status', 'Approved');
        }], 'balance_amount');
    }
}
