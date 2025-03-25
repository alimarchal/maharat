<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('companies')) {
            $this->command->warn('The companies table does not exist. Skipping CompanySeeder.');
            return;
        }

        DB::table('grn_receive_goods')->delete();
        DB::table('grns')->delete();
        DB::table('purchase_orders')->delete();
        DB::table('material_request_items')->delete();
        DB::table('material_requests')->delete();
        DB::table('rfqs')->delete();
        DB::table('budgets')->delete(); 
        DB::table('departments')->delete(); 
        DB::table('quotations')->delete();

        DB::table('companies')->delete();

        DB::statement('ALTER TABLE companies AUTO_INCREMENT = 1;');

        $sarCurrencyId = DB::table('currencies')
            ->where('code', 'SAR')
            ->value('id');

        if (!$sarCurrencyId) {
            $this->command->error('SAR currency not found. Please run CurrencySeeder first.');
            return;
        }

        DB::transaction(function () use ($sarCurrencyId) {
            $companies = [
                [
                    'name' => 'Maharat',
                    'name_ar' => 'مهارات',
                    'email' => 'smartprocure@maharat.com',
                    'contact_number' => '+966112233445',
                    'country' => 'Saudi Arabia',
                    'city' => 'Riyadh',
                    'currency_id' => $sarCurrencyId,
                    'account_name' => 'MAHARAT CONSTRUCTION TRAINING CENTER (MCTC)',
                    'account_no' => '242-089787-001',
                    'license_no' => 'L-310522',
                    'iban' => 'SA0345000000242089787001',
                    'bank' => 'Saudi National Bank (SNB)',
                    'branch' => 'Khobar Main Branch',
                    'swift' => 'SABBSARI',
                ],
                [
                    'name' => 'Beta Solutions',
                    'name_ar' => 'بيتا سوليوشنز',
                    'email' => 'info@betasolutions.com',
                    'contact_number' => '+966556677889',
                    'country' => 'Saudi Arabia',
                    'city' => 'Jeddah',
                    'currency_id' => $sarCurrencyId,
                    'account_name' => 'Beta Solutions Ltd.',
                    'account_no' => '123-456789-001',
                    'license_no' => 'L-987654',
                    'iban' => 'SA0388888888123456789001',
                    'bank' => 'Al Rajhi Bank',
                    'branch' => 'Jeddah Main Branch',
                    'swift' => 'RJHISARI',
                ],
                [
                    'name' => 'Gamma Corp',
                    'name_ar' => 'غاما كورب',
                    'email' => 'support@gammacorp.com',
                    'contact_number' => '+966998877665',
                    'country' => 'Saudi Arabia',
                    'city' => 'Dammam',
                    'currency_id' => $sarCurrencyId,
                    'account_name' => 'Gamma Corp Trading',
                    'account_no' => '345-678901-002',
                    'license_no' => 'L-765432',
                    'iban' => 'SA031111111134567890002',
                    'bank' => 'Bank Albilad',
                    'branch' => 'Dammam Central Branch',
                    'swift' => 'ALBISARI',
                ],
                [
                    'name' => 'Delta Enterprises',
                    'name_ar' => 'دلتا انتربرايزس',
                    'email' => 'sales@deltaenterprises.com',
                    'contact_number' => '+966334455667',
                    'country' => 'Saudi Arabia',
                    'city' => 'Medina',
                    'currency_id' => $sarCurrencyId,
                    'account_name' => 'Delta Enterprises Co.',
                    'account_no' => '567-890123-003',
                    'license_no' => 'L-543210',
                    'iban' => 'SA0344444444567890123003',
                    'bank' => 'Saudi Investment Bank',
                    'branch' => 'Medina Business Branch',
                    'swift' => 'SIBCSARI',
                ],
                [
                    'name' => 'Epsilon Industries',
                    'name_ar' => 'إبسيلون اندستريز',
                    'email' => 'info@epsilonindustries.com',
                    'contact_number' => '+966112244668',
                    'country' => 'Saudi Arabia',
                    'city' => 'Mecca',
                    'currency_id' => $sarCurrencyId,
                    'account_name' => 'Epsilon Industries Ltd.',
                    'account_no' => '789-012345-004',
                    'license_no' => 'L-135790',
                    'iban' => 'SA0377777777789012345004',
                    'bank' => 'Arab National Bank',
                    'branch' => 'Mecca Financial Center',
                    'swift' => 'ARNBSARI',
                ],
            ];
            
        
            Company::insert($companies);
        });

        $this->command->info('Companies table seeded successfully.');
    }
}
