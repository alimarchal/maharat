<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FiscalYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the record already exists
        $exists = DB::table('fiscal_years')->where('fiscal_year', 2025)->exists();
        if (!$exists) {
            DB::table('fiscal_years')->insert([
                'fiscal_year' => 2025,
                'name' => 'Budget 2025',
                'start_date' => '2025-01-01',
                'end_date' => '2025-12-31',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $this->command->info('Fiscal year 2025 seeded successfully.');
        } else {
            $this->command->info('Fiscal year 2025 already exists.');
        }
    }
} 