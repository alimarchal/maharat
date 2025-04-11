<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetUsage extends Model
{
    use HasFactory, UserTracking;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sub_cost_center',
        'fiscal_period_id',
        'sub_cost_center_approved_amount',
        'sub_cost_center_reserved_amount',
        'sub_cost_center_consumed_amount',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'sub_cost_center_approved_amount' => 'decimal:2',
        'sub_cost_center_reserved_amount' => 'decimal:2',
        'sub_cost_center_consumed_amount' => 'decimal:2',
    ];

    /**
     * Get the cost center that this budget usage belongs to.
     */
    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'sub_cost_center');
    }

    /**
     * Get the fiscal period that this budget usage belongs to.
     */
    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }
}
