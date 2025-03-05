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
        'updated_by'
    ];

    protected $casts = [
        'effective_start_date' => 'date',
        'effective_end_date' => 'date',
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
}
