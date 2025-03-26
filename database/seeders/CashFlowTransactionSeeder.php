<?php

namespace Database\Seeders;

use App\Models\CashFlowTransaction;
use App\Models\Account;
use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class CashFlowTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some accounts to work with
        $accounts = Account::take(5)->get();
        $chartOfAccounts = ChartOfAccount::take(5)->get();

        if ($accounts->isEmpty() || $chartOfAccounts->isEmpty()) {
            $this->command->info('No accounts or chart of accounts found. Please seed them first.');
            return;
        }

        foreach ($accounts as $account) {
            $balance = 0;

            // Create 10 transactions for each account
            for ($i = 0; $i < 10; $i++) {
                $type = rand(0, 1) ? 'Credit' : 'Debit';
                $amount = rand(100, 10000) / 100;

                // Update balance based on transaction type
                if ($type === 'Credit') {
                    $balance += $amount;
                } else {
                    $balance -= $amount;
                }

                CashFlowTransaction::create([
                    'transaction_date' => now()->subDays(rand(0, 30)),
                    'transaction_type' => $type,
                    'chart_of_account_id' => $chartOfAccounts->random()->id,
                    'account_id' => $account->id,
                    'amount' => $amount,
                    'balance_amount' => $balance,
                    'payment_method' => ['Cash', 'Bank Transfer', 'Credit Card'][rand(0, 2)],
                    'reference_number' => 'REF-' . rand(1000, 9999),
                    'reference_type' => ['Invoice', 'Payment', 'Refund', 'Expense'][rand(0, 3)],
                    'description' => 'Sample transaction ' . ($i + 1),
                    'created_by' => 1,
                    'updated_by' => 1
                ]);
            }
        }
    }
}
