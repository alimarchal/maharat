<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('currencies')->delete();

        $currencies = [
            [
                'code' => 'SAR',
                'name' => 'Saudi Riyal',
                'fraction_name' => 'Halala',
                'rate' => 1.00000,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'AED',
                'name' => 'UAE Dirham',
                'fraction_name' => 'Fils',
                'rate' => 0.98000,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'USD',
                'name' => 'US Dollar',
                'fraction_name' => 'Cent',
                'rate' => 0.26667,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'EUR',
                'name' => 'Euro',
                'fraction_name' => 'Cent',
                'rate' => 0.24453,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'GBP',
                'name' => 'British Pound',
                'fraction_name' => 'Penny',
                'rate' => 0.21089,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'KWD',
                'name' => 'Kuwaiti Dinar',
                'fraction_name' => 'Fils',
                'rate' => 0.08222,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'BHD',
                'name' => 'Bahraini Dinar',
                'fraction_name' => 'Fils',
                'rate' => 0.10043,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'QAR',
                'name' => 'Qatari Riyal',
                'fraction_name' => 'Dirham',
                'rate' => 0.97089,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'OMR',
                'name' => 'Omani Rial',
                'fraction_name' => 'Baisa',
                'rate' => 0.10267,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'JOD',
                'name' => 'Jordanian Dinar',
                'fraction_name' => 'Piastre',
                'rate' => 0.18911,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'EGP',
                'name' => 'Egyptian Pound',
                'fraction_name' => 'Piastre',
                'rate' => 8.23451,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'INR',
                'name' => 'Indian Rupee',
                'fraction_name' => 'Paisa',
                'rate' => 22.15674,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'PKR',
                'name' => 'Pakistani Rupee',
                'fraction_name' => 'Paisa',
                'rate' => 74.85632,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'CNY',
                'name' => 'Chinese Yuan',
                'fraction_name' => 'Fen',
                'rate' => 1.92345,
                'last_updated_at' => now(),
            ],
            [
                'code' => 'JPY',
                'name' => 'Japanese Yen',
                'fraction_name' => 'Sen',
                'rate' => 39.45632,
                'last_updated_at' => now(),
            ],
        ];

        foreach ($currencies as $currency) {
            Currency::create($currency);
        }
    }
}
