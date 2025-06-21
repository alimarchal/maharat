<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FiscalPeriod extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'fiscal_year_id',
        'period_name',
        'start_date',
        'end_date',
        'transaction_closed_upto',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'transaction_closed_upto' => 'date'
    ];

    /**
     * Get the fiscal year that owns the fiscal period.
     */
    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    /**
     * Get the user who created the fiscal period.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the fiscal period.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the budgets associated with this fiscal period.
     */
    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    /**
     * Check if the fiscal period has any budgets.
     */
    public function hasBudgets(): bool
    {
        return $this->budgets()->exists();
    }

    /**
     * Scope for active fiscal periods (those with Open or Adjusting status).
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['Open', 'Adjusting']);
    }

    /**
     * Scope for closed fiscal periods.
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'Closed');
    }

    /**
     * Scope for fiscal periods within a specific fiscal year.
     */
    public function scopeForYear($query, $year)
    {
        return $query->whereHas('fiscalYear', function ($q) use ($year) {
            $q->where('fiscal_year', $year);
        });
    }
}
