<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetReallocationHistory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'budget_reallocation_history';

    protected $fillable = [
        'reallocation_request_id',
        'source_budget_request_id',
        'destination_budget_request_id',
        'reallocate_amount',
        'source_old_balance',
        'source_new_balance',
        'destination_old_balance',
        'destination_new_balance',
        'source_old_approved_amount',
        'source_new_approved_amount',
        'destination_old_approved_amount',
        'destination_new_approved_amount',
        'source_type',
        'purchase_order_id',
        'source_old_requested_amount',
        'destination_old_requested_amount',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'reallocate_amount' => 'decimal:2',
        'source_old_balance' => 'decimal:2',
        'source_new_balance' => 'decimal:2',
        'destination_old_balance' => 'decimal:2',
        'destination_new_balance' => 'decimal:2',
        'source_old_approved_amount' => 'decimal:2',
        'source_new_approved_amount' => 'decimal:2',
        'destination_old_approved_amount' => 'decimal:2',
        'destination_new_approved_amount' => 'decimal:2',
        'source_old_requested_amount' => 'decimal:2',
        'destination_old_requested_amount' => 'decimal:2',
    ];

    /**
     * Get the reallocation request that owns this history record.
     */
    public function reallocationRequest(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class, 'reallocation_request_id');
    }

    /**
     * Get the source budget request.
     */
    public function sourceBudgetRequest(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class, 'source_budget_request_id');
    }

    /**
     * Get the destination budget request.
     */
    public function destinationBudgetRequest(): BelongsTo
    {
        return $this->belongsTo(RequestBudget::class, 'destination_budget_request_id');
    }

    /**
     * Get the user who created this history record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who updated this history record.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the purchase order associated with this reallocation history.
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
