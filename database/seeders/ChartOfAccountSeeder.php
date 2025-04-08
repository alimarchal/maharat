<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ChartOfAccount;

class ChartOfAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch existing account_code IDs (should be 1 to 5)
        $accountCodes = range(1, 5); // Since you confirmed IDs are 1 to 5

        // Define meaningful descriptions
        $descriptions = [
            "Cash & Cash Equivalents",
            "Short-term Investments",
            "Accounts Receivable",
            "Prepaid Expenses",
            "Inventory",
            "Long-term Investments",
            "Property, Plant & Equipment",
            "Accumulated Depreciation",
            "Land",
            "Intangible Assets",
        ];

        // Insert 10 records using a loop
        for ($i = 1; $i <= 10; $i++) {
            ChartOfAccount::create([
                'parent_id' => null, 
                'account_code_id' => $accountCodes[array_rand($accountCodes)], // Pick a valid ID
                'account_name' => "Account $i",
                'is_active' => 1, 
                'description' => $descriptions[$i - 1], // Use real category name
            ]);
        }
    }
}
