<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaterialRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete dependent records first
        DB::table('material_request_items')->delete();

        // Now delete the main table records
        DB::table('material_requests')->delete();

        // Reset Auto Increment (Only if table is empty)
        if (DB::table('material_requests')->count() === 0) {
            DB::statement('ALTER TABLE material_requests AUTO_INCREMENT = 1');
        }

        // Sample material requests
        $materialRequests = [
            [
                'requester_id' => 1,
                'warehouse_id' => 101,
                'department_id' => 1,
                'cost_center_id' => 1,
                'sub_cost_center_id' => 1,
                'expected_delivery_date' => '2025-04-10',
                'status_id' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'requester_id' => 2,
                'warehouse_id' => 102,
                'department_id' => 1,
                'cost_center_id' => 1,
                'sub_cost_center_id' => 1,
                'expected_delivery_date' => '2025-04-15',
                'status_id' => 2,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'requester_id' => 3,
                'warehouse_id' => 103,
                'department_id' => 1,
                'cost_center_id' => 1,
                'sub_cost_center_id' => 1,
                'expected_delivery_date' => '2025-04-20',
                'status_id' => 3,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data into the database
        DB::table('material_requests')->insert($materialRequests);
    }

}
