<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AssetTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        AssetTransaction::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $assets = Asset::all();
        $transactions = [];

        foreach ($assets as $asset) {
            // Initial acquisition transaction
            $transactions[] = [
                'asset_id' => $asset->id,
                'transaction_type' => 'acquisition',
                'amount' => $asset->acquisition_cost,
                'transaction_date' => $asset->acquisition_date,
                'reference_number' => 'ACQ-' . $asset->asset_code,
                'notes' => 'Initial acquisition of ' . $asset->name,
            ];

            // Add depreciation transactions for fixed assets
            if ($asset->type === 'fixed' && $asset->depreciation_method !== 'none') {
                $depreciationAmount = ($asset->acquisition_cost - $asset->salvage_value) / $asset->useful_life_years;
                $currentDate = $asset->acquisition_date;
                
                for ($i = 1; $i <= 2; $i++) { // Add 2 years of depreciation
                    $currentDate = date('Y-m-d', strtotime($currentDate . ' +1 year'));
                    $transactions[] = [
                        'asset_id' => $asset->id,
                        'transaction_type' => 'depreciation',
                        'amount' => $depreciationAmount,
                        'transaction_date' => $currentDate,
                        'reference_number' => 'DEP-' . $asset->asset_code . '-' . $i,
                        'notes' => 'Annual depreciation for ' . $asset->name,
                    ];
                }
            }

            // Add maintenance transaction for some assets
            if (in_array($asset->type, ['fixed', 'current'])) {
                $transactions[] = [
                    'asset_id' => $asset->id,
                    'transaction_type' => 'maintenance',
                    'amount' => $asset->acquisition_cost * 0.02, // 2% of acquisition cost
                    'transaction_date' => date('Y-m-d', strtotime($asset->acquisition_date . ' +6 months')),
                    'reference_number' => 'MNT-' . $asset->asset_code,
                    'notes' => 'Regular maintenance for ' . $asset->name,
                ];
            }
        }

        foreach ($transactions as $transaction) {
            AssetTransaction::create($transaction);
        }
    }
}
