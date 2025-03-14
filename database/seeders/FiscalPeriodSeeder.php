<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class FiscalPeriodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('fiscal_periods')) {
            $this->command->warn('The fiscal_periods table does not exist. Skipping FiscalPeriodSeeder.');
            return;
        }

        try {
            // First, delete related records in `budgets` table safely
            if (Schema::hasTable('budgets')) {
                DB::table('budgets')
                    ->whereIn('fiscal_period_id', function ($query) {
                        $query->select('id')->from('fiscal_periods');
                    })
                    ->delete();
            }

            // Now, delete fiscal periods safely
            DB::table('fiscal_periods')->delete();

            // Reset auto-increment (if on MySQL)
            try {
                DB::statement('ALTER TABLE fiscal_periods AUTO_INCREMENT = 1');
            } catch (\Exception $e) {
                // Ignore errors on databases that don't support this statement
                $this->command->warn('Could not reset AUTO_INCREMENT on fiscal_periods table. Continuing anyway.');
            }

            // Sample fiscal periods with explicit IDs
            $fiscalPeriods = [
                [
                    'id' => 1, // Explicit ID for reference in other seeders
                    'fiscal_year' => '2025-01-01',
                    'period_number' => 1,
                    'period_name' => 'January 2025',
                    'start_date' => '2025-01-01',
                    'end_date' => '2025-01-31',
                    'transaction_closed_upto' => null,
                    'status' => 'Open',
                    'created_by' => 1,
                    'updated_by' => 2,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 2,
                    'fiscal_year' => '2025-01-01',
                    'period_number' => 2,
                    'period_name' => 'February 2025',
                    'start_date' => '2025-02-01',
                    'end_date' => '2025-02-28',
                    'transaction_closed_upto' => '2025-02-20',
                    'status' => 'Closed',
                    'created_by' => 1,
                    'updated_by' => 3,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 3,
                    'fiscal_year' => '2025-01-01',
                    'period_number' => 3,
                    'period_name' => 'March 2025',
                    'start_date' => '2025-03-01',
                    'end_date' => '2025-03-31',
                    'transaction_closed_upto' => null,
                    'status' => 'Adjusting',
                    'created_by' => 2,
                    'updated_by' => null,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Insert data into the database
            DB::table('fiscal_periods')->insert($fiscalPeriods);

            $this->command->info('Fiscal periods seeded successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error seeding fiscal periods: ' . $e->getMessage());
            throw $e; // Re-throw to let Laravel's seeder know there was an error
        }
    }
}
