<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionFlow extends Model
{
    use HasFactory;

    protected $table = 'transactions_flow';

    protected $fillable = [
        'account_id',
        'transaction_type',
        'amount',
        'balance_after',
        'related_entity_type',
        'related_entity_id',
        'related_accounts',
        'description',
        'reference_number',
        'transaction_date',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'related_accounts' => 'array',
        'transaction_date' => 'date'
    ];

    /**
     * Get the account that owns the transaction flow.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user who created the transaction flow.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the transaction flow.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope to get transactions for a specific account.
     */
    public function scopeForAccount($query, $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    /**
     * Scope to get transactions for a specific entity.
     */
    public function scopeForEntity($query, $entityType, $entityId)
    {
        return $query->where('related_entity_type', $entityType)
                    ->where('related_entity_id', $entityId);
    }

    /**
     * Scope to get transactions within a date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }
}
