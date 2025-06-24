<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Account;
use App\Models\AccountCode;
use App\Models\ChartOfAccount;
use App\Models\CostCenter;

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

        // Get or create Marketing cost center
        $marketingCostCenter = CostCenter::firstOrCreate(
            ['name' => 'Marketing'], 
            [
                'name' => 'Marketing',
                'description' => 'Marketing department cost center',
                'is_active' => true
            ]
        );

        // Define the list of standard accounts to create with descriptions and account numbers
        $accountsData = [
            [
                'name' => 'Assets', 
                'account_number' => '1000',
                'description' => 'All company assets including cash, equipment, and investments',
                'code' => $asset, 
                'editable' => true, 
                'deletable' => false
            ],
            [
                'name' => 'Liabilities', 
                'account_number' => '2000',
                'description' => 'Company debts and obligations to creditors',
                'code' => $liability, 
                'editable' => false, 
                'deletable' => false
            ],
            [
                'name' => 'Equity', 
                'account_number' => '3000',
                'description' => 'Owner investment and retained earnings',
                'code' => $equity, 
                'editable' => true, 
                'deletable' => false
            ],
            [
                'name' => 'Revenue/Income', 
                'account_number' => '4000',
                'description' => 'Income generated from business operations',
                'code' => $revenue, 
                'editable' => false, 
                'deletable' => false
            ],
            [
                'name' => 'Cost of Purchases', 
                'account_number' => '5000',
                'description' => 'Direct costs of goods and services purchased',
                'code' => $expense, 
                'editable' => false, 
                'deletable' => false
            ],
            [
                'name' => 'Operating Expenses', 
                'account_number' => '5100',
                'description' => 'Day-to-day business operating costs',
                'code' => $expense, 
                'editable' => true, 
                'deletable' => false
            ],
            [
                'name' => 'Non-Operating Expenses', 
                'account_number' => '5200',
                'description' => 'Expenses not related to core business operations',
                'code' => $expense, 
                'editable' => true, 
                'deletable' => false
            ],
            [
                'name' => 'VAT Paid (on purchases)', 
                'account_number' => '5300',
                'description' => 'Value Added Tax paid on business purchases',
                'code' => $expense, 
                'editable' => false, 
                'deletable' => false
            ],
            [
                'name' => 'VAT Collected (on Maharat invoices)', 
                'account_number' => '4100',
                'description' => 'VAT collected from customers on Maharat invoices',
                'code' => $revenue, 
                'editable' => false, 
                'deletable' => false
            ],
            [
                'name' => 'Special accounts', 
                'account_number' => '9000',
                'description' => 'Special purpose accounts for specific transactions',
                'code' => $special, 
                'editable' => true, 
                'deletable' => true
            ],
            [
                'name' => 'Account Receivable', 
                'account_number' => '1100',
                'description' => 'Amounts owed by customers for services rendered',
                'code' => $revenue, 
                'editable' => false, 
                'deletable' => false
            ],
            [
                'name' => 'Cash', 
                'account_number' => '1200',
                'description' => 'Cash and cash equivalents held by the company',
                'code' => $asset, 
                'editable' => true, 
                'deletable' => false
            ],
            [
                'name' => 'VAT Receivables (On Maharat Invoice)', 
                'account_number' => '2100',
                'description' => 'VAT amounts receivable from government on Maharat invoices',
                'code' => $liability, 
                'editable' => false, 
                'deletable' => false
            ],
        ];

        foreach ($accountsData as $data) {
            // Step 1: Create the Chart of Account (the category)
            $chartOfAccount = ChartOfAccount::create([
                'account_name' => $data['name'],
                'account_code_id' => $data['code']->id,
                'is_active' => true,
                'description' => $data['description'],
            ]);

            // Step 2: Create the Account record itself
            Account::create([
                'name' => $data['name'],
                'account_number' => $data['account_number'],
                'description' => $data['description'],
                'chart_of_account_id' => $chartOfAccount->id,
                'account_code_id' => $data['code']->id,
                'cost_center_id' => $marketingCostCenter->id,
                'status' => 'Approved',
                // The 'editable' and 'deletable' flags are conceptual for the UI, not stored in DB
            ]);
        }
    }
}
