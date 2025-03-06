<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalPeriod extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'fiscal_year',
        'period_number',
        'period_name',
        'start_date',
        'end_date',
        'transaction_closed_upto',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'fiscal_year' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'transaction_closed_upto' => 'date'
    ];

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
        return $query->whereYear('fiscal_year', $year);
    }
}
