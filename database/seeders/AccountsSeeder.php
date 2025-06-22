<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Account;
use App\Models\AccountCode;
use App\Models\ChartOfAccount;

class AccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Temporarily disable foreign key checks to allow truncation
        Schema::disableForeignKeyConstraints();

        // Truncate the tables to ensure a clean slate
        Account::truncate();
        ChartOfAccount::truncate();

        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();

        // Define and create account codes (types) to ensure they exist
        $asset = AccountCode::firstOrCreate(['account_type' => 'Asset'], ['account_code' => 1000]);
        $liability = AccountCode::firstOrCreate(['account_type' => 'Liability'], ['account_code' => 2000]);
        $equity = AccountCode::firstOrCreate(['account_type' => 'Equity'], ['account_code' => 3000]);
        $revenue = AccountCode::firstOrCreate(['account_type' => 'Revenue'], ['account_code' => 4000]);
        $expense = AccountCode::firstOrCreate(['account_type' => 'Expense'], ['account_code' => 5000]);
        $special = AccountCode::firstOrCreate(['account_type' => 'Special'], ['account_code' => 9000]);

        // Define the list of standard accounts to create
        $accountsData = [
            ['name' => 'Assets', 'code' => $asset, 'editable' => true, 'deletable' => false],
            ['name' => 'Liabilities', 'code' => $liability, 'editable' => false, 'deletable' => false],
            ['name' => 'Equity', 'code' => $equity, 'editable' => true, 'deletable' => false],
            ['name' => 'Revenue/Income', 'code' => $revenue, 'editable' => false, 'deletable' => false],
            ['name' => 'Cost of Purchases', 'code' => $expense, 'editable' => false, 'deletable' => false],
            ['name' => 'Operating Expenses', 'code' => $expense, 'editable' => true, 'deletable' => false],
            ['name' => 'Non-Operating Expenses', 'code' => $expense, 'editable' => true, 'deletable' => false],
            ['name' => 'VAT Paid (on purchases)', 'code' => $expense, 'editable' => false, 'deletable' => false],
            ['name' => 'VAT Collected (on Maharat invoices)', 'code' => $revenue, 'editable' => false, 'deletable' => false],
            ['name' => 'Special accounts', 'code' => $special, 'editable' => true, 'deletable' => true],
        ];

        foreach ($accountsData as $data) {
            // Step 1: Create the Chart of Account (the category)
            $chartOfAccount = ChartOfAccount::create([
                'account_name' => $data['name'],
                'account_code_id' => $data['code']->id,
                'is_active' => true,
            ]);

            // Step 2: Create the Account record itself
            Account::create([
                'name' => $data['name'],
                'chart_of_account_id' => $chartOfAccount->id,
                'account_code_id' => $data['code']->id,
                'status' => 'Approved',
                // The 'editable' and 'deletable' flags are conceptual for the UI, not stored in DB
            ]);
        }
    }
}
