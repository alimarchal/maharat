<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WarehouseManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure that warehouses exist
        if (DB::table('warehouses')->count() == 0) {
            $this->command->warn('Warehouses table is empty. Skipping WarehouseManagerSeeder.');
            return;
        }

        // Clear existing warehouse manager data to prevent duplication
        DB::table('warehouse_managers')->truncate();

        // Sample warehouse manager data
        $warehouseManagers = [
            [
                'warehouse_id' => 201,
                'manager_id' => 1, // Ensure that manager_id = 1 exists
                'type' => 'Manager',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'warehouse_id' => 202,
                'manager_id' => 1,
                'type' => 'Assistant',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'warehouse_id' => 203,
                'manager_id' => 1,
                'type' => 'Manager',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'warehouse_id' => 204,
                'manager_id' => 1,
                'type' => 'Assistant',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert warehouse manager data into the database
        DB::table('warehouse_managers')->insert($warehouseManagers);

        $this->command->info('Warehouse managers seeded successfully.');
    }
}
