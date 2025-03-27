<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class FinancialTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('financial_transactions')) {
            $this->command->warn('The financial_transactions table does not exist. Skipping FinancialTransactionSeeder.');
            return;
        }

        try {
            $this->command->info('Starting FinancialTransactionSeeder...');

            // First verify that all required foreign keys exist
            $this->verifyForeignKeys();

            DB::beginTransaction();
            $this->command->info('Transaction started.');

            // Clear existing records
            DB::table('financial_transactions')->delete();
            $this->command->info('Cleaned existing financial transactions.');

            // Get actual existing IDs from the database
            $accountCodeIds = DB::table('account_codes')->pluck('id')->toArray();
            $chartOfAccountIds = DB::table('chart_of_accounts')->pluck('id')->toArray();
            $accountIds = DB::table('accounts')->pluck('id')->toArray();
            $departmentIds = DB::table('departments')->pluck('id')->toArray();
            $costCenterIds = DB::table('cost_centers')->pluck('id')->toArray();
            $fiscalPeriodIds = DB::table('fiscal_periods')->pluck('id')->toArray();
            $userIds = DB::table('users')->pluck('id')->toArray();

            $this->command->info('Retrieved existing IDs from database:');
            $this->command->info("- Account Codes: " . implode(', ', $accountCodeIds));
            $this->command->info("- Chart of Accounts: " . implode(', ', $chartOfAccountIds));
            $this->command->info("- Accounts: " . implode(', ', $accountIds));
            $this->command->info("- Departments: " . implode(', ', $departmentIds));
            $this->command->info("- Cost Centers: " . implode(', ', $costCenterIds));
            $this->command->info("- Fiscal Periods: " . implode(', ', $fiscalPeriodIds));
            $this->command->info("- Users: " . implode(', ', $userIds));

            $entryTypes = ['Regular', 'Adjustment', 'Closing', 'Opening', 'Reversal'];
            $statuses = ['Draft', 'Posted', 'Approved', 'Canceled', 'Reversed'];

            // Generate transactions
            $transactions = [];
            for ($i = 1; $i <= 10; $i++) {
                $createdAt = Carbon::now()->subDays(rand(1, 365));
                $updatedAt = $createdAt->copy()->addDays(rand(0, 30));
                
                $transactions[] = [
                    'account_code_id' => $accountCodeIds[array_rand($accountCodeIds)],
                    'chart_of_account_id' => $chartOfAccountIds[array_rand($chartOfAccountIds)],
                    'account_id' => $accountIds[array_rand($accountIds)],
                    'department_id' => $departmentIds[array_rand($departmentIds)],
                    'cost_center_id' => $costCenterIds[array_rand($costCenterIds)],
                    'fiscal_period_id' => $fiscalPeriodIds[array_rand($fiscalPeriodIds)],
                    'sub_cost_center_id' => null,
                    'transaction_date' => $createdAt->format('Y-m-d H:i:s'),
                    'entry_type' => $entryTypes[array_rand($entryTypes)],
                    'status' => $statuses[array_rand($statuses)],
                    'reference_number' => 'REF-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'amount' => rand(10000, 5000000) / 100,
                    'description' => "Transaction $i description",
                    'created_by' => $userIds[array_rand($userIds)],
                    'updated_by' => rand(0, 1) ? $userIds[array_rand($userIds)] : null,
                    'approved_by' => rand(0, 1) ? $userIds[array_rand($userIds)] : null,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                    'approved_at' => rand(0, 1) ? $updatedAt : null,
                    'posted_at' => rand(0, 1) ? $updatedAt : null,
                ];
            }

            $this->command->info('Generated ' . count($transactions) . ' transactions.');

            // Insert data
            DB::table('financial_transactions')->insert($transactions);
            $this->command->info('Inserted transactions successfully.');

            DB::commit();
            $this->command->info('Transaction committed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error in FinancialTransactionSeeder: ' . $e->getMessage());
            throw $e;
        }
    }

    private function verifyForeignKeys(): void
    {
        $requiredTables = [
            'account_codes',
            'chart_of_accounts',
            'accounts',
            'departments',
            'cost_centers',
            'fiscal_periods',
            'users'
        ];

        foreach ($requiredTables as $table) {
            if (!Schema::hasTable($table)) {
                throw new \Exception("Required table '{$table}' does not exist.");
            }

            $count = DB::table($table)->count();
            if ($count === 0) {
                throw new \Exception("Table '{$table}' exists but has no records. Please run {$table} seeder first.");
            }
            $this->command->info("Verified {$table}: {$count} records found.");
        }
    }
}


