<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            ['code' => 'SAR', 'name' => 'Saudi Riyal', 'fraction_name' => 'Halala', 'rate' => 1.00000],
            ['code' => 'AED', 'name' => 'UAE Dirham', 'fraction_name' => 'Fils', 'rate' => 0.98000],
            ['code' => 'USD', 'name' => 'US Dollar', 'fraction_name' => 'Cent', 'rate' => 0.26667],
            ['code' => 'EUR', 'name' => 'Euro', 'fraction_name' => 'Cent', 'rate' => 0.24453],
            ['code' => 'GBP', 'name' => 'British Pound', 'fraction_name' => 'Penny', 'rate' => 0.21089],
            ['code' => 'KWD', 'name' => 'Kuwaiti Dinar', 'fraction_name' => 'Fils', 'rate' => 0.08222],
            ['code' => 'BHD', 'name' => 'Bahraini Dinar', 'fraction_name' => 'Fils', 'rate' => 0.10043],
            ['code' => 'QAR', 'name' => 'Qatari Riyal', 'fraction_name' => 'Dirham', 'rate' => 0.97089],
            ['code' => 'OMR', 'name' => 'Omani Rial', 'fraction_name' => 'Baisa', 'rate' => 0.10267],
            ['code' => 'JOD', 'name' => 'Jordanian Dinar', 'fraction_name' => 'Piastre', 'rate' => 0.18911],
            ['code' => 'EGP', 'name' => 'Egyptian Pound', 'fraction_name' => 'Piastre', 'rate' => 8.23451],
            ['code' => 'INR', 'name' => 'Indian Rupee', 'fraction_name' => 'Paisa', 'rate' => 22.15674],
            ['code' => 'PKR', 'name' => 'Pakistani Rupee', 'fraction_name' => 'Paisa', 'rate' => 74.85632],
            ['code' => 'CNY', 'name' => 'Chinese Yuan', 'fraction_name' => 'Fen', 'rate' => 1.92345],
            ['code' => 'JPY', 'name' => 'Japanese Yen', 'fraction_name' => 'Sen', 'rate' => 39.45632],
        ];

        foreach ($currencies as $currency) {
            Currency::updateOrCreate(
                ['code' => $currency['code']], // Find by currency code
                array_merge($currency, ['last_updated_at' => now()])
            );
        }
    }
}

