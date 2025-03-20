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
                'name' => 'Maharat',
                'name_ar' => 'مهارات',
                'email' => 'smartprocure@maharat.com',
                'contact_number' => '+966112233445',
                'country' => 'Saudi Arabia',
                'city' => 'Riyadh',
            ],
            [
                'name' => 'Beta Solutions',
                'name_ar' => 'بيتا سوليوشنز',
                'email' => 'info@betasolutions.com',
                'contact_number' => '+966556677889',
                'country' => 'Saudi Arabia',
                'city' => 'Jeddah',
            ],
            [
                'name' => 'Gamma Corp',
                'name_ar' => 'غاما كورب',
                'email' => 'support@gammacorp.com',
                'contact_number' => '+966998877665',
                'country' => 'Saudi Arabia',
                'city' => 'Dammam',
            ],
            [
                'name' => 'Delta Enterprises',
                'name_ar' => 'دلتا انتربرايزس',
                'email' => 'sales@deltaenterprises.com',
                'contact_number' => '+966334455667',
                'country' => 'Saudi Arabia',
                'city' => 'Medina',
            ],
            [
                'name' => 'Epsilon Industries',
                'name_ar' => 'إبسيلون اندستريز',
                'email' => 'info@epsilonindustries.com',
                'contact_number' => '+966112244668',
                'country' => 'Saudi Arabia',
                'city' => 'Mecca',
            ],
        ];

        foreach ($companies as $company) {
            Company::create($company);
        }
    }
}
