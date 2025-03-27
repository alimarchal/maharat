<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EquityAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'account_code',
        'type',
        'description',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created the equity account.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the equity account.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Generate a unique account code
     */
    public static function generateAccountCode(string $type): string
    {
        $prefix = match($type) {
            'owner_capital' => 'OC',
            'retained_earnings' => 'RE',
            'drawings' => 'DR',
            'contributed_capital' => 'CC',
            'treasury_stock' => 'TS',
            'other_equity' => 'OE',
            default => 'EQ'
        };

        $lastAccount = self::where('type', $type)
            ->orderBy('account_code', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastAccount) {
            $parts = explode('-', $lastAccount->account_code);
            if (count($parts) >= 2) {
                $nextNumber = (int)$parts[1] + 1;
            }
        }

        return sprintf("%s-%04d", $prefix, $nextNumber);
    }


    /**
     * Get the transactions for the equity account.
     */
    public function transactions()
    {
        return $this->hasMany(EquityTransaction::class);
    }
}
