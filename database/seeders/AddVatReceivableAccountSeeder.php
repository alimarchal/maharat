<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Account;
use App\Models\AccountCode;
use App\Models\ChartOfAccount;
use App\Models\CostCenter;

class AddVatReceivableAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder adds Account 14 (VAT Receivable on Purchases) without affecting existing accounts.
     */
    public function run(): void
    {
        // Check if Account 14 already exists
        $existingAccount = Account::where('id', 14)->orWhere('name', 'VAT Receivable (On Purchases)')->first();
        
        if ($existingAccount) {
            $this->command->warn('Account 14 (VAT Receivable on Purchases) already exists. Skipping...');
            return;
        }

        // Get or create Asset account code
        $asset = AccountCode::firstOrCreate(
            ['account_type' => 'Asset'], 
            ['account_code' => 1000]
        );

        // Get or create Marketing cost center (or use first available)
        // Try to find existing Marketing cost center first
        $marketingCostCenter = CostCenter::where('name', 'Marketing')->first();
        
        if (!$marketingCostCenter) {
            // If not found, try to get any existing cost center
            $marketingCostCenter = CostCenter::first();
            
            if (!$marketingCostCenter) {
                // If no cost centers exist, create one
                $marketingCostCenter = CostCenter::create([
                    'name' => 'Marketing',
                    'code' => 'CC001',
                    'description' => 'Marketing department cost center',
                    'status' => 'Approved',
                    'cost_center_type' => 'Fixed',
                    'effective_start_date' => now()->toDateString(),
                ]);
            }
        }

        // Create the Chart of Account entry
        $chartOfAccount = ChartOfAccount::create([
            'account_name' => 'VAT Receivable (On Purchases)',
            'account_code_id' => $asset->id,
            'is_active' => true,
            'description' => 'VAT amounts receivable from government on purchases (will be refunded)',
        ]);

        // Create the Account record
        $account = Account::create([
            'name' => 'VAT Receivable (On Purchases)',
            'account_number' => '1300',
            'description' => 'VAT amounts receivable from government on purchases (will be refunded)',
            'chart_of_account_id' => $chartOfAccount->id,
            'account_code_id' => $asset->id,
            'cost_center_id' => $marketingCostCenter->id,
            'status' => 'Approved',
            'credit_amount' => 0,
            'debit_amount' => 0,
        ]);

        $this->command->info('Account 14 (VAT Receivable on Purchases) created successfully!');
        $this->command->info('Account ID: ' . $account->id);
        $this->command->info('Account Number: ' . $account->account_number);
    }
}

