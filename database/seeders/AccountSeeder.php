<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('accounts')) {
            $this->command->warn('The accounts table does not exist. Skipping AccountSeeder.');
            return;
        }

        // First handle the cleanup
        try {
            $this->command->info('Starting cleanup process...');

            // Delete related records in cash_flow_transactions first
            if (Schema::hasTable('cash_flow_transactions')) {
                $deletedCount = DB::table('cash_flow_transactions')->delete();
                $this->command->info("Deleted {$deletedCount} records from cash_flow_transactions.");
            }

            // Delete accounts
            $deletedCount = DB::table('accounts')->delete();
            $this->command->info("Deleted {$deletedCount} records from accounts.");

            // Reset auto-increment
            DB::statement('ALTER TABLE accounts AUTO_INCREMENT = 1');
            $this->command->info('Reset accounts auto-increment.');

        } catch (\Exception $e) {
            $this->command->error('Error during cleanup: ' . $e->getMessage());
            throw $e;
        }

        // Now handle the data insertion in a separate transaction
        try {
            $this->command->info('Starting data insertion process...');
            
            DB::beginTransaction();
            $this->command->info('Transaction started.');

            // Define the possible ranges for foreign keys
            $chartOfAccountIds = range(1, 10);
            $costCenterIds = range(1, 3);
            $departmentIds = range(2, 6);
            $userIds = range(1, 5);

            // Generate 10 account records
            $accounts = [];
            for ($i = 1; $i <= 10; $i++) {
                $accounts[] = [
                    'chart_of_account_id' => $chartOfAccountIds[array_rand($chartOfAccountIds)],
                    'cost_center_id' => $costCenterIds[array_rand($costCenterIds)],
                    'department_id' => $departmentIds[array_rand($departmentIds)],
                    'name' => "Account $i",
                    'description' => "Description for Account $i",
                    'status' => ['Approved', 'Pending'][array_rand(['Approved', 'Pending'])],
                    'created_by' => $userIds[array_rand($userIds)],
                    'updated_by' => rand(0, 1) ? $userIds[array_rand($userIds)] : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $this->command->info('Account records prepared: ' . count($accounts));

            // Verify foreign key values exist
            $this->command->info('Verifying foreign key values...');
            $this->verifyForeignKeys($accounts);

            // Insert data into the database
            DB::table('accounts')->insert($accounts);
            $this->command->info('Account records inserted successfully.');

            DB::commit();
            $this->command->info('Transaction committed successfully.');

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
                $this->command->info('Transaction rolled back.');
            }
            $this->command->error('Error during data insertion: ' . $e->getMessage());
            throw $e;
        }
    }

    private function verifyForeignKeys(array $accounts): void
    {
        // Check chart_of_account_ids
        $chartIds = array_unique(array_column($accounts, 'chart_of_account_id'));
        $existingChartIds = DB::table('chart_of_accounts')
            ->whereIn('id', $chartIds)
            ->pluck('id')
            ->toArray();
        if (count($chartIds) !== count($existingChartIds)) {
            throw new \Exception('Some chart_of_account_ids do not exist in the database.');
        }

        // Check cost_center_ids
        $centerIds = array_unique(array_column($accounts, 'cost_center_id'));
        $existingCenterIds = DB::table('cost_centers')
            ->whereIn('id', $centerIds)
            ->pluck('id')
            ->toArray();
        if (count($centerIds) !== count($existingCenterIds)) {
            throw new \Exception('Some cost_center_ids do not exist in the database.');
        }

        // Check department_ids
        $deptIds = array_unique(array_column($accounts, 'department_id'));
        $existingDeptIds = DB::table('departments')
            ->whereIn('id', $deptIds)
            ->pluck('id')
            ->toArray();
        if (count($deptIds) !== count($existingDeptIds)) {
            throw new \Exception('Some department_ids do not exist in the database.');
        }

        // Check user_ids
        $userIds = array_unique(array_merge(
            array_column($accounts, 'created_by'),
            array_filter(array_column($accounts, 'updated_by'))
        ));
        $existingUserIds = DB::table('users')
            ->whereIn('id', $userIds)
            ->pluck('id')
            ->toArray();
        if (count($userIds) !== count($existingUserIds)) {
            throw new \Exception('Some user_ids do not exist in the database.');
        }

        $this->command->info('All foreign key values verified successfully.');
    }
}