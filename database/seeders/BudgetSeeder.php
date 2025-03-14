<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BudgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete existing records
        DB::table('budgets')->delete();
        DB::statement('ALTER TABLE cost_centers AUTO_INCREMENT = 1'); // Reset Auto Increment


        // Sample budget records
        $budgets = [
            [
                'fiscal_period_id' => 1,
                'department_id' => 2,
                'cost_center_id' => 1,
                'description' => 'Marketing budget for Q1 2025',
                'total_revenue_planned' => 500000.00,
                'total_revenue_actual' => 480000.00,
                'total_expense_planned' => 300000.00,
                'total_expense_actual' => 290000.00,
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 2,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'fiscal_period_id' => 2,
                'department_id' => 4,
                'cost_center_id' => 2,
                'description' => 'IT infrastructure upgrade',
                'total_revenue_planned' => 750000.00,
                'total_revenue_actual' => 700000.00,
                'total_expense_planned' => 500000.00,
                'total_expense_actual' => 480000.00,
                'status' => 'Frozen',
                'created_by' => 2,
                'updated_by' => 3,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'fiscal_period_id' => 3,
                'department_id' => 5,
                'cost_center_id' => 3,
                'description' => 'Operational budget for FY 2025',
                'total_revenue_planned' => 1200000.00,
                'total_revenue_actual' => 1150000.00,
                'total_expense_planned' => 850000.00,
                'total_expense_actual' => 830000.00,
                'status' => 'Closed',
                'created_by' => 3,
                'updated_by' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data into the database
        DB::table('budgets')->insert($budgets);
    }
}
