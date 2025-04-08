<?php

namespace Database\Seeders;

use App\Models\EquityAccount;
use App\Models\EquityTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EquityTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        EquityTransaction::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $equityAccounts = EquityAccount::all();
        $transactions = [];

        foreach ($equityAccounts as $account) {
            // Initial investment for owner capital
            if ($account->type === 'owner_capital') {
                $transactions[] = [
                    'equity_account_id' => $account->id,
                    'transaction_type' => 'owner_investment',
                    'amount' => 1000000.00,
                    'transaction_date' => '2023-01-01',
                    'reference_number' => 'INV-' . $account->account_code,
                    'description' => 'Initial investment by owner',
                ];
            }

            // Add some retained earnings
            if ($account->type === 'retained_earnings') {
                $transactions[] = [
                    'equity_account_id' => $account->id,
                    'transaction_type' => 'profit_allocation',
                    'amount' => 250000.00,
                    'transaction_date' => '2023-12-31',
                    'reference_number' => 'PROF-' . $account->account_code,
                    'description' => 'Annual profit allocation',
                ];
            }

            // Add some owner drawings
            if ($account->type === 'drawings') {
                $transactions[] = [
                    'equity_account_id' => $account->id,
                    'transaction_type' => 'owner_withdrawal',
                    'amount' => 50000.00,
                    'transaction_date' => '2023-06-30',
                    'reference_number' => 'DRAW-' . $account->account_code,
                    'description' => 'Mid-year owner withdrawal',
                ];
            }

            // Add some contributed capital
            if ($account->type === 'contributed_capital') {
                $transactions[] = [
                    'equity_account_id' => $account->id,
                    'transaction_type' => 'stock_issuance',
                    'amount' => 200000.00,
                    'transaction_date' => '2023-03-15',
                    'reference_number' => 'CONT-' . $account->account_code,
                    'description' => 'Additional capital contribution',
                ];
            }

            // Add some treasury stock transactions
            if ($account->type === 'treasury_stock') {
                $transactions[] = [
                    'equity_account_id' => $account->id,
                    'transaction_type' => 'stock_buyback',
                    'amount' => 100000.00,
                    'transaction_date' => '2023-09-30',
                    'reference_number' => 'TREAS-' . $account->account_code,
                    'description' => 'Stock repurchase program',
                ];
            }
        }

        foreach ($transactions as $transaction) {
            EquityTransaction::create($transaction);
        }
    }
}
