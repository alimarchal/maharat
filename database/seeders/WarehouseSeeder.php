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

        // Check if warehouses table is already populated
        if (DB::table('warehouses')->count() > 0) {
            $this->command->warn('Warehouses table already has data. Skipping WarehouseSeeder to prevent data loss.');
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;'); // Disable foreign key checks

        try {
            // Only truncate warehouses table if it's empty
            if (DB::table('warehouses')->count() === 0) {
                DB::table('warehouses')->truncate();
            }

            // Single warehouse data for Riyadh
            $warehouses = [
                [
                    'id' => 201,
                    'name' => 'Riyadh Main Warehouse',
                    'code' => 'RUH001',
                    'address' => 'Riyadh, Saudi Arabia',
                    'latitude' => 24.7136,
                    'longitude' => 46.6753,
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
