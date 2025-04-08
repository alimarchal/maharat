<?php

namespace Database\Seeders;

use App\Models\EquityAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EquityAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        EquityAccount::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $equityAccounts = [
            [
                'name' => 'Owner Capital',
                'type' => 'owner_capital',
                'description' => 'Initial investment by the owner',
                'is_active' => true,
            ],
            [
                'name' => 'Retained Earnings',
                'type' => 'retained_earnings',
                'description' => 'Accumulated profits not distributed as dividends',
                'is_active' => true,
            ],
            [
                'name' => 'Owner Drawings',
                'type' => 'drawings',
                'description' => 'Withdrawals made by the owner',
                'is_active' => true,
            ],
            [
                'name' => 'Contributed Capital',
                'type' => 'contributed_capital',
                'description' => 'Additional capital contributed by owners',
                'is_active' => true,
            ],
            [
                'name' => 'Treasury Stock',
                'type' => 'treasury_stock',
                'description' => 'Company stock that has been repurchased',
                'is_active' => true,
            ],
            [
                'name' => 'Other Equity',
                'type' => 'other_equity',
                'description' => 'Miscellaneous equity accounts',
                'is_active' => true,
            ],
        ];

        foreach ($equityAccounts as $account) {
            $account['account_code'] = EquityAccount::generateAccountCode($account['type']);
            EquityAccount::create($account);
        }
    }
}
