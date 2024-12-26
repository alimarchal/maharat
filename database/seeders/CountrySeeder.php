<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Currency;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('countries')->delete();

        $currencyMap = Currency::pluck('id', 'code')->toArray();

        $countries = [
            // Middle East
            [
                'name' => 'Saudi Arabia',
                'code' => 'SA',
                'phone_code' => '+966',
                'currency_id' => $currencyMap['SAR'],
                'is_active' => true,
            ],
            [
                'name' => 'United Arab Emirates',
                'code' => 'AE',
                'phone_code' => '+971',
                'currency_id' => $currencyMap['AED'],
                'is_active' => true,
            ],
            [
                'name' => 'Kuwait',
                'code' => 'KW',
                'phone_code' => '+965',
                'currency_id' => $currencyMap['KWD'],
                'is_active' => true,
            ],
            [
                'name' => 'Bahrain',
                'code' => 'BH',
                'phone_code' => '+973',
                'currency_id' => $currencyMap['BHD'],
                'is_active' => true,
            ],
            [
                'name' => 'Qatar',
                'code' => 'QA',
                'phone_code' => '+974',
                'currency_id' => $currencyMap['QAR'],
                'is_active' => true,
            ],
            [
                'name' => 'Oman',
                'code' => 'OM',
                'phone_code' => '+968',
                'currency_id' => $currencyMap['OMR'],
                'is_active' => true,
            ],
            [
                'name' => 'Jordan',
                'code' => 'JO',
                'phone_code' => '+962',
                'currency_id' => $currencyMap['JOD'],
                'is_active' => true,
            ],
            [
                'name' => 'Egypt',
                'code' => 'EG',
                'phone_code' => '+20',
                'currency_id' => $currencyMap['EGP'],
                'is_active' => true,
            ],

            // Europe
            [
                'name' => 'United Kingdom',
                'code' => 'GB',
                'phone_code' => '+44',
                'currency_id' => $currencyMap['GBP'],
                'is_active' => true,
            ],
            [
                'name' => 'Germany',
                'code' => 'DE',
                'phone_code' => '+49',
                'currency_id' => $currencyMap['EUR'],
                'is_active' => true,
            ],
            [
                'name' => 'France',
                'code' => 'FR',
                'phone_code' => '+33',
                'currency_id' => $currencyMap['EUR'],
                'is_active' => true,
            ],
            [
                'name' => 'Italy',
                'code' => 'IT',
                'phone_code' => '+39',
                'currency_id' => $currencyMap['EUR'],
                'is_active' => true,
            ],
            [
                'name' => 'Spain',
                'code' => 'ES',
                'phone_code' => '+34',
                'currency_id' => $currencyMap['EUR'],
                'is_active' => true,
            ],
            [
                'name' => 'Netherlands',
                'code' => 'NL',
                'phone_code' => '+31',
                'currency_id' => $currencyMap['EUR'],
                'is_active' => true,
            ],

            // Asia
            [
                'name' => 'India',
                'code' => 'IN',
                'phone_code' => '+91',
                'currency_id' => $currencyMap['INR'],
                'is_active' => true,
            ],
            [
                'name' => 'Pakistan',
                'code' => 'PK',
                'phone_code' => '+92',
                'currency_id' => $currencyMap['PKR'],
                'is_active' => true,
            ],
            [
                'name' => 'China',
                'code' => 'CN',
                'phone_code' => '+86',
                'currency_id' => $currencyMap['CNY'],
                'is_active' => true,
            ],
            [
                'name' => 'Japan',
                'code' => 'JP',
                'phone_code' => '+81',
                'currency_id' => $currencyMap['JPY'],
                'is_active' => true,
            ],

            // North America
            [
                'name' => 'United States',
                'code' => 'US',
                'phone_code' => '+1',
                'currency_id' => $currencyMap['USD'],
                'is_active' => true,
            ],
            [
                'name' => 'Canada',
                'code' => 'CA',
                'phone_code' => '+1',
                'currency_id' => $currencyMap['USD'],
                'is_active' => true,
            ],
            [
                'name' => 'Mexico',
                'code' => 'MX',
                'phone_code' => '+52',
                'currency_id' => $currencyMap['USD'],
                'is_active' => true,
            ],
        ];

        foreach ($countries as $country) {
            Country::create($country);
        }
    }
}
