<?php

namespace App\Models;

use App\Traits\UserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes, UserTracking;

    protected $fillable = [
        'name',
        'asset_code',
        'type',
        'status',
        'acquisition_cost',
        'current_value',
        'salvage_value',
        'acquisition_date',
        'disposal_date',
        'useful_life_years',
        'depreciation_method',
        'description',
        'location',
        'department',
        'is_leased',
        'lease_expiry_date',
    ];

    protected $casts = [
        'acquisition_cost' => 'decimal:2',
        'current_value' => 'decimal:2',
        'salvage_value' => 'decimal:2',
        'acquisition_date' => 'date',
        'disposal_date' => 'date',
        'is_leased' => 'boolean',
        'lease_expiry_date' => 'date',
    ];

    // Generate a unique asset code
    public static function generateAssetCode(): string
    {
        $prefix = 'AST';
        $year = date('Y');
        $lastAsset = self::whereYear('created_at', $year)
            ->orderBy('asset_code', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastAsset) {
            $parts = explode('-', $lastAsset->asset_code);
            if (count($parts) >= 3) {
                $nextNumber = (int)$parts[2] + 1;
            }
        }

        return sprintf("%s-%s-%05d", $prefix, $year, $nextNumber);
    }

    /**
     * Get the transactions for the asset.
     */
    public function transactions()
    {
        return $this->hasMany(AssetTransaction::class);
    }
}
