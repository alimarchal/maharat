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

            // Sample warehouse data for KSA
            $warehouses = [
                [
                    'id' => 201,
                    'name' => 'Riyadh Central Warehouse',
                    'code' => 'RUH001',
                    'address' => 'Second Industrial City, Riyadh',
                    'latitude' => 24.7136,
                    'longitude' => 46.6753,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 202,
                    'name' => 'Jeddah Logistics Hub',
                    'code' => 'JED002',
                    'address' => 'Jeddah Industrial Area Phase 3, Jeddah',
                    'latitude' => 21.4858,
                    'longitude' => 39.1925,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 203,
                    'name' => 'Dammam Distribution Center',
                    'code' => 'DMM003',
                    'address' => 'Dammam Second Industrial City, Dammam',
                    'latitude' => 26.3927,
                    'longitude' => 49.9777,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 204,
                    'name' => 'Makkah Storage Facility',
                    'code' => 'MAK004',
                    'address' => 'King Abdullah Road, Makkah',
                    'latitude' => 21.3891,
                    'longitude' => 39.8579,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 205,
                    'name' => 'Madinah Supply Chain Hub',
                    'code' => 'MED005',
                    'address' => 'Al Madinah Industrial Area, Madinah',
                    'latitude' => 24.5247,
                    'longitude' => 39.5692,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 206,
                    'name' => 'Yanbu Export Warehouse',
                    'code' => 'YNB006',
                    'address' => 'Yanbu Industrial City, Yanbu',
                    'latitude' => 24.0895,
                    'longitude' => 38.0637,
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
