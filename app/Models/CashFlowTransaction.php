<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashFlowTransaction extends Model
{
    use HasFactory, SoftDeletes, UserTracking;

    protected $fillable = [
        'transaction_date',
        'transaction_type',
        'chart_of_account_id',
        'sub_cost_center_id',
        'account_id',
        'amount',
        'balance_amount',
        'payment_method',
        'reference_number',
        'reference_type',
        'description',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
    ];

    /**
     * Get the chart of account that owns the transaction.
     */
    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class);
    }

    /**
     * Get the sub cost center that owns the transaction.
     */
    public function subCostCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'sub_cost_center_id');
    }

    /**
     * Get the account that owns the transaction.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user who created the transaction.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the transaction.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Calculate the new balance based on the previous transaction
     *
     * @param string $accountId
     * @param float $amount
     * @param string $type
     * @return float
     */
    public static function calculateNewBalance(string $accountId, float $amount, string $type): float
    {

        $lastTransaction = self::where('account_id', $accountId)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->first();

        $currentBalance = $lastTransaction ? $lastTransaction->balance_amount : 0;

        return $type === 'Credit'
            ? $currentBalance + $amount
            : $currentBalance - $amount;
    }


    private function recalculateAccountBalances(string $accountId, string $fromDate): void
    {
        // Get the last transaction before the specified date to establish starting balance
        $lastTransaction = CashFlowTransaction::where('account_id', $accountId)
            ->where('transaction_date', '<', $fromDate)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $currentBalance = $lastTransaction ? $lastTransaction->balance_amount : 0;

        // Get all transactions from the specified date onwards, ordered by date
        $transactions = CashFlowTransaction::where('account_id', $accountId)
            ->where('transaction_date', '>=', $fromDate)
            ->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($transactions as $transaction) {
            // Update the balance based on transaction type
            if ($transaction->transaction_type === 'Credit') {
                $currentBalance += $transaction->amount;
            } else {
                $currentBalance -= $transaction->amount;
            }

            // Update the transaction with the new balance
            $transaction->balance_amount = $currentBalance;
            $transaction->save();
        }
    }
}
