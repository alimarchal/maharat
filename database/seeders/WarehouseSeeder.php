<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the warehouses table exists
        if (!Schema::hasTable('warehouses')) {
            $this->command->warn('The warehouses table does not exist. Skipping WarehouseSeeder.');
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;'); // Disable foreign key checks

        try {
            // Delete dependent records in related tables before truncating warehouses
            if (Schema::hasTable('rfqs')) {
                DB::table('rfqs')->truncate();
            }

            // Truncate the warehouses table (faster than delete + reset AUTO_INCREMENT)
            DB::table('warehouses')->truncate();

            // Sample warehouse data
            $warehouses = [
                [
                    'id' => 101,
                    'name' => 'Dubai Main Warehouse',
                    'code' => 'DXB009',
                    'address' => 'Dubai Industrial City',
                    'latitude' => 25.0657,
                    'longitude' => 55.1713,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 102,
                    'name' => 'Karachi Distribution Center',
                    'code' => 'KHI002',
                    'address' => 'Korangi Industrial Area, Karachi',
                    'latitude' => 24.8607,
                    'longitude' => 67.0011,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 103,
                    'name' => 'Lahore Storage Facility',
                    'code' => 'LHE005',
                    'address' => 'Lahore Cantt, Lahore',
                    'latitude' => 31.5497,
                    'longitude' => 74.3436,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 104,
                    'name' => 'Abu Dhabi Logistics Hub',
                    'code' => 'AUH003',
                    'address' => 'Mussafah Industrial Area, Abu Dhabi',
                    'latitude' => 24.3872,
                    'longitude' => 54.4185,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Insert warehouse data
            Warehouse::insert($warehouses);

            DB::statement('SET FOREIGN_KEY_CHECKS=1;'); // Re-enable foreign key checks

            $this->command->info('Warehouses seeded successfully.');
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;'); // Ensure foreign keys are re-enabled
            $this->command->error('Error seeding warehouses: ' . $e->getMessage());
        }
    }
}
