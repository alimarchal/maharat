<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class CashFlowTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('cash_flow_transactions')) {
            $this->command->warn('The cash_flow_transactions table does not exist. Skipping CashFlowTransactionSeeder.');
            return;
        }

        try {
            // Check if required tables exist
            if (!Schema::hasTable('accounts') || !Schema::hasTable('chart_of_accounts')) {
                $this->command->warn('Required tables (accounts, chart_of_accounts) do not exist. Skipping CashFlowTransactionSeeder.');
                return;
            }

            // Get existing accounts
            $accounts = DB::table('accounts')->pluck('id')->toArray();
            if (empty($accounts)) {
                $this->command->warn('No accounts found. Please run AccountSeeder first.');
                return;
            }

            // Get existing chart of accounts
            $chartOfAccounts = DB::table('chart_of_accounts')->pluck('id')->toArray();
            if (empty($chartOfAccounts)) {
                $this->command->warn('No chart of accounts found. Please run ChartOfAccountSeeder first.');
                return;
            }

            // Get existing users for created_by and updated_by
            $users = DB::table('users')->pluck('id')->toArray();
            if (empty($users)) {
                $this->command->warn('No users found. Please run UserSeeder first.');
                return;
            }

            // Clear existing transactions
            DB::table('cash_flow_transactions')->truncate();
            DB::statement('ALTER TABLE cash_flow_transactions AUTO_INCREMENT = 1');

            $transactions = [];
            $startDate = Carbon::now()->subMonths(3);
            $endDate = Carbon::now();

            // Define allowed payment methods
            $allowedPaymentMethods = ['Cash', 'Bank Transfer', 'Credit Card'];

            // Generate 50 sample transactions
            for ($i = 0; $i < 50; $i++) {
                $transactionDate = Carbon::createFromTimestamp(
                    rand($startDate->timestamp, $endDate->timestamp)
                );

                $amount = rand(1000, 100000) / 100; // Random amount between 10.00 and 1000.00
                $type = rand(0, 1) ? 'Credit' : 'Debit';
                $paymentMethod = $allowedPaymentMethods[array_rand($allowedPaymentMethods)];
                $referenceType = ['Invoice', 'Payment', 'Refund', 'Expense'][rand(0, 3)];

                $transactions[] = [
                    'transaction_date' => $transactionDate,
                    'transaction_type' => $type,
                    'chart_of_account_id' => $chartOfAccounts[array_rand($chartOfAccounts)],
                    'account_id' => $accounts[array_rand($accounts)],
                    'amount' => $amount,
                    'balance_amount' => $amount * (rand(80, 120) / 100), // Random balance between 80% and 120% of amount
                    'payment_method' => $paymentMethod,
                    'reference_number' => 'REF-' . str_pad($i + 1, 6, '0', STR_PAD_LEFT),
                    'reference_type' => $referenceType,
                    'description' => ucfirst($type) . ' transaction for ' . $referenceType . ' ' . ($i + 1),
                    'created_by' => $users[array_rand($users)],
                    'updated_by' => $users[array_rand($users)],
                    'created_at' => $transactionDate,
                    'updated_at' => $transactionDate,
                ];
            }

            // Insert all transactions
            DB::table('cash_flow_transactions')->insert($transactions);

            $this->command->info('Cash flow transactions seeded successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error seeding cash flow transactions: ' . $e->getMessage());
        }
    }
}
