<?php

namespace Database\Seeders;

use App\Models\Asset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AssetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        Asset::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $assets = [
            [
                'name' => 'Office Building',
                'type' => 'fixed',
                'status' => 'active',
                'acquisition_cost' => 5000000.00,
                'current_value' => 5000000.00,
                'salvage_value' => 1000000.00,
                'acquisition_date' => '2023-01-01',
                'useful_life_years' => 30,
                'depreciation_method' => 'straight_line',
                'description' => 'Main office building',
                'location' => 'Headquarters',
                'department' => 'Administration',
                'is_leased' => false,
            ],
            [
                'name' => 'Company Vehicles',
                'type' => 'fixed',
                'status' => 'active',
                'acquisition_cost' => 250000.00,
                'current_value' => 200000.00,
                'salvage_value' => 50000.00,
                'acquisition_date' => '2023-06-15',
                'useful_life_years' => 5,
                'depreciation_method' => 'declining_balance',
                'description' => 'Fleet of company vehicles',
                'location' => 'Headquarters',
                'department' => 'Operations',
                'is_leased' => false,
            ],
            [
                'name' => 'Office Equipment',
                'type' => 'fixed',
                'status' => 'active',
                'acquisition_cost' => 150000.00,
                'current_value' => 120000.00,
                'salvage_value' => 15000.00,
                'acquisition_date' => '2023-03-01',
                'useful_life_years' => 7,
                'depreciation_method' => 'straight_line',
                'description' => 'Computers, printers, and other office equipment',
                'location' => 'Headquarters',
                'department' => 'IT',
                'is_leased' => false,
            ],
            [
                'name' => 'Cash in Bank',
                'type' => 'current',
                'status' => 'active',
                'acquisition_cost' => 1000000.00,
                'current_value' => 1000000.00,
                'salvage_value' => 0.00,
                'acquisition_date' => '2023-01-01',
                'useful_life_years' => null,
                'depreciation_method' => 'none',
                'description' => 'Main operating account',
                'location' => 'Bank',
                'department' => 'Finance',
                'is_leased' => false,
            ],
            [
                'name' => 'Trademark',
                'type' => 'intangible',
                'status' => 'active',
                'acquisition_cost' => 50000.00,
                'current_value' => 50000.00,
                'salvage_value' => 0.00,
                'acquisition_date' => '2023-01-01',
                'useful_life_years' => 10,
                'depreciation_method' => 'straight_line',
                'description' => 'Company trademark',
                'location' => 'Legal',
                'department' => 'Legal',
                'is_leased' => false,
            ],
        ];

        foreach ($assets as $asset) {
            $asset['asset_code'] = Asset::generateAssetCode();
            Asset::create($asset);
        }
    }
}
