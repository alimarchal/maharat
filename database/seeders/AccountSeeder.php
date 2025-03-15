<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AccountCodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the account_codes table exists
        if (Schema::hasTable('account_codes')) {
            // Delete existing records
            DB::table('account_codes')->truncate();

            // Sample account code records
            $accountCodes = [
                [
                    'code' => 'A100',
                    'description' => 'Assets',
                    'account_type' => 'Asset',
                    'parent_id' => null,
                    'created_by' => 1,
                    'updated_by' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'code' => 'L200',
                    'description' => 'Liabilities',
                    'account_type' => 'Liability',
                    'parent_id' => null,
                    'created_by' => 1,
                    'updated_by' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'code' => 'R300',
                    'description' => 'Revenue',
                    'account_type' => 'Revenue',
                    'parent_id' => null,
                    'created_by' => 1,
                    'updated_by' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'code' => 'E400',
                    'description' => 'Expenses',
                    'account_type' => 'Expense',
                    'parent_id' => null,
                    'created_by' => 1,
                    'updated_by' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Insert data into the database
            DB::table('account_codes')->insert($accountCodes);
        } else {
            $this->command->warn('The account_codes table does not exist. Skipping AccountCodeSeeder.');
        }
    }
}