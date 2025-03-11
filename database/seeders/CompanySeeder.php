<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companies = [
            [
                'name' => 'Alpha Tech',
                'name_ar' => 'ألفا تك',
                'email' => 'contact@alphatech.com',
                'contact_number' => '+966112233445',
                'country' => 'Saudi Arabia',
                'city' => 'Riyadh',
                'currency' => 'SAR',
                'timezone' => 'UTC+03:00',
            ],
            [
                'name' => 'Beta Solutions',
                'name_ar' => 'بيتا سوليوشنز',
                'email' => 'info@betasolutions.com',
                'contact_number' => '+966556677889',
                'country' => 'Saudi Arabia',
                'city' => 'Jeddah',
                'currency' => 'SAR',
                'timezone' => 'UTC+03:00',
            ],
            [
                'name' => 'Gamma Corp',
                'name_ar' => 'غاما كورب',
                'email' => 'support@gammacorp.com',
                'contact_number' => '+966998877665',
                'country' => 'Saudi Arabia',
                'city' => 'Dammam',
                'currency' => 'SAR',
                'timezone' => 'UTC+03:00',
            ],
            [
                'name' => 'Delta Enterprises',
                'name_ar' => 'دلتا انتربرايزس',
                'email' => 'sales@deltaenterprises.com',
                'contact_number' => '+966334455667',
                'country' => 'Saudi Arabia',
                'city' => 'Medina',
                'currency' => 'SAR',
                'timezone' => 'UTC+03:00',
            ],
            [
                'name' => 'Epsilon Industries',
                'name_ar' => 'إبسيلون اندستريز',
                'email' => 'info@epsilonindustries.com',
                'contact_number' => '+966112244668',
                'country' => 'Saudi Arabia',
                'city' => 'Mecca',
                'currency' => 'SAR',
                'timezone' => 'UTC+03:00',
            ],
        ];

        foreach ($companies as $company) {
            Company::create($company);
        }
    }
}
