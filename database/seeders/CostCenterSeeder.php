<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CostCenterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete existing records
        DB::table('cost_centers')->delete();
        DB::statement('ALTER TABLE cost_centers AUTO_INCREMENT = 1'); // Reset Auto Increment

        // Sample cost center records
        $costCenters = [
            [
                'id' => 1,
                'parent_id' => null,
                'department_id' => 1,
                'code' => 'CC001',
                'name' => 'Marketing',
                'cost_center_type' => 'Fixed',
                'description' => 'Marketing department cost center',
                'status' => 'Approved',
                'effective_start_date' => '2025-03-13',
                'effective_end_date' => null,
                'manager_id' => 5,
                'budget_owner_id' => 8,
                'created_by' => 1,
                'updated_by' => 2,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 2,
                'parent_id' => 1,
                'department_id' => 2,
                'code' => 'CC002',
                'name' => 'IT Infrastructure',
                'cost_center_type' => 'Support',
                'description' => 'IT cost center for infrastructure',
                'status' => 'Pending',
                'effective_start_date' => '2025-03-13',
                'effective_end_date' => '2026-03-13',
                'manager_id' => 6,
                'budget_owner_id' => 9,
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 3,
                'parent_id' => 2,
                'department_id' => 3,
                'code' => 'CC003',
                'name' => 'Research & Development',
                'cost_center_type' => 'Variable',
                'description' => 'R&D cost center for new products',
                'status' => 'Approved',
                'effective_start_date' => '2025-03-13',
                'effective_end_date' => null,
                'manager_id' => 7,
                'budget_owner_id' => 10,
                'created_by' => 3,
                'updated_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data into the database
        DB::table('cost_centers')->insert($costCenters);
    }
}
