<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete existing records instead of truncating
        DB::table('inventories')->delete(); 

        // Reset auto-increment (optional)
        DB::statement('ALTER TABLE inventories AUTO_INCREMENT = 1');

        // Sample inventory records
        $inventories = [
            [
                'user_id' => 1,
                'warehouse_id' => 101,
                'product_id' => 201,
                'quantity' => 500.0000,
                'reorder_level' => 50.0000,
                'description' => 'Electronics stock - laptops and accessories',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'user_id' => 2,
                'warehouse_id' => 102,
                'product_id' => 202,
                'quantity' => 1200.0000,
                'reorder_level' => 100.0000,
                'description' => 'Office supplies - paper, pens, and printers',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'user_id' => 3,
                'warehouse_id' => 103,
                'product_id' => 203,
                'quantity' => 750.0000,
                'reorder_level' => 80.0000,
                'description' => 'Food and beverages inventory',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data
        DB::table('inventories')->insert($inventories);
    }

}
