<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class WarehouseManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the warehouses table exists
        if (!Schema::hasTable('warehouse_managers')) {
            $this->command->warn('The warehouse_managers table does not exist. Skipping WarehouseManagerSeeder.');
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;'); // Disable foreign key checks

        try {
            // Clear any existing warehouse manager data to prevent duplication
            DB::table('warehouse_managers')->truncate();
            
            $warehouseManagers = [
                [
                    'warehouse_id' => 101,
                    'manager_id' => 1, 
                    'type' => 'Manager',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'warehouse_id' => 102,
                    'manager_id' => 1,
                    'type' => 'Assistant',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'warehouse_id' => 103,
                    'manager_id' => 1,
                    'type' => 'Manager',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'warehouse_id' => 104,
                    'manager_id' => 1,
                    'type' => 'Assistant',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Insert warehouse manager data into the database
            DB::table('warehouse_managers')->insert($warehouseManagers);

            DB::statement('SET FOREIGN_KEY_CHECKS=1;'); 

            $this->command->info('Warehouse managers seeded successfully.');
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;'); 
            $this->command->error('Error seeding warehouse managers: ' . $e->getMessage());
        }
    }
}
