<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquityTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'equity_account_id',
        'transaction_type',
        'amount',
        'transaction_date',
        'reference_number',
        'description',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    /**
     * Get the equity account associated with the transaction.
     */
    public function equityAccount(): BelongsTo
    {
        return $this->belongsTo(EquityAccount::class);
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
     * Generate a unique reference number for transactions
     */
    public static function generateReferenceNumber(string $type): string
    {
        $prefix = match($type) {
            'owner_investment' => 'OI',
            'owner_withdrawal' => 'OW',
            'profit_allocation' => 'PA',
            'loss_allocation' => 'LA',
            'dividend_declaration' => 'DD',
            'stock_issuance' => 'SI',
            'stock_buyback' => 'SB',
            'revaluation' => 'RV',
            default => 'ET'
        };

        $year = date('Y');
        $month = date('m');

        $lastTransaction = self::where('transaction_type', $type)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('reference_number', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastTransaction && $lastTransaction->reference_number) {
            $parts = explode('-', $lastTransaction->reference_number);
            if (count($parts) >= 4) {
                $nextNumber = (int)$parts[3] + 1;
            }
        }

        return sprintf("%s-%s-%s-%05d", $prefix, $year, $month, $nextNumber);
    }
}
