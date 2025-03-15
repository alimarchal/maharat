<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetRequestApprovalTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'request_budgets_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'description',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'order' => 'integer',
        'status' => 'string'
    ];

    /**
     * Get the request budget associated with the transaction.
     */
    public function requestBudget(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class, 'request_budgets_id');
    }

    /**
     * Get the requester user.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get the user this transaction is assigned to.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user this transaction is referred to.
     */
    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_to');
    }

    /**
     * Get the user who created this record.
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this record.
     */
    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
