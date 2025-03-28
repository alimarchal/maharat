<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetTransaction extends Model
{
    use HasFactory, UserTracking;

    protected $fillable = [
        'asset_id',
        'transaction_type',
        'amount',
        'transaction_date',
        'reference_number',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    /**
     * Get the asset associated with the transaction.
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * Get the user who created the transaction.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate a unique reference number for transactions
     */
    public static function generateReferenceNumber(string $type): string
    {
        $prefix = match ($type) {
            'acquisition' => 'ACQ',
            'depreciation' => 'DEP',
            'revaluation' => 'REV',
            'maintenance' => 'MNT',
            'disposal' => 'DIS',
            'transfer' => 'TRN',
            default => 'TRX'
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
