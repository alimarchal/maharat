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

        // First, clean up all dependent tables
        try {
            // 1. First level - Delete tables that depend on purchase_orders
            if (Schema::hasTable('external_invoices')) {
                DB::table('external_invoices')->delete();
                $this->command->info('Cleaned external_invoices.');
            }

            if (Schema::hasTable('grn_receive_goods')) {
        DB::table('grn_receive_goods')->delete();
                $this->command->info('Cleaned grn_receive_goods.');
            }

            if (Schema::hasTable('grns')) {
        DB::table('grns')->delete();
                $this->command->info('Cleaned grns.');
            }

            // 2. Second level - Delete purchase_orders and its dependencies
            if (Schema::hasTable('purchase_orders')) {
        DB::table('purchase_orders')->delete();
                $this->command->info('Cleaned purchase_orders.');
            }

            // 3. Third level - Delete remaining dependent tables
            if (Schema::hasTable('quotations')) {
                DB::table('quotations')->delete();
                $this->command->info('Cleaned quotations.');
            }

            if (Schema::hasTable('material_request_items')) {
        DB::table('material_request_items')->delete();
                $this->command->info('Cleaned material_request_items.');
            }

            if (Schema::hasTable('material_requests')) {
        DB::table('material_requests')->delete();
                $this->command->info('Cleaned material_requests.');
            }

            if (Schema::hasTable('rfqs')) {
        DB::table('rfqs')->delete();
                $this->command->info('Cleaned rfqs.');
            }

            if (Schema::hasTable('budgets')) {
        DB::table('budgets')->delete(); 
                $this->command->info('Cleaned budgets.');
            }

            // Delete accounts before departments due to foreign key constraint
            if (Schema::hasTable('accounts')) {
                DB::table('accounts')->delete();
                $this->command->info('Cleaned accounts.');
            }

            // Now we can safely delete departments
            if (Schema::hasTable('departments')) {
        DB::table('departments')->delete(); 
                $this->command->info('Cleaned departments.');
            }

            // 4. Clean companies
        DB::table('companies')->delete();
            $this->command->info('Cleaned companies.');

            // Reset auto-increment outside transaction
            DB::statement('ALTER TABLE companies AUTO_INCREMENT = 1');
            $this->command->info('Reset companies auto-increment.');

        } catch (\Exception $e) {
            $this->command->error('Error cleaning tables: ' . $e->getMessage());
            throw $e;
        }

        // Now insert new data in a separate transaction
        try {
            DB::beginTransaction();

            // Get SAR currency ID
            $sarCurrencyId = DB::table('currencies')
                ->where('code', 'SAR')
                ->value('id');

            if (!$sarCurrencyId) {
                throw new \Exception('SAR currency not found. Please run CurrencySeeder first.');
            }

            // Company data
            $companies = [
                [
                    'name' => 'Maharat',
                    'name_ar' => 'مهارات',
                    'email' => 'smartprocure@maharat.com',
                    'contact_number' => '+966501234567',
                    'address' => 'Al Olaya, Riyadh, Saudi Arabia',
                    'website' => 'www.maharat.smartpunch.app',
                    'country' => 'Saudi Arabia',
                    'city' => 'Riyadh',
                    'postal_code' => '547000',
                    'currency_id' => $sarCurrencyId,
                    'vat_no' => '300123456700003',
                    'cr_no' => '1010234567',
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
                    'contact_number' => '+966502345678',
                    'address' => 'King Abdulaziz Road, Jeddah, Saudi Arabia',
                    'website' => 'www.beta.com',
                    'country' => 'Saudi Arabia',
                    'city' => 'Jeddah',
                    'postal_code' => '23456',
                    'currency_id' => $sarCurrencyId,
                    'vat_no' => '300234567800004',
                    'cr_no' => '1010345678',
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
                    'contact_number' => '+966503456789',
                    'address' => 'Prince Mohammed Bin Fahd Road, Dammam, Saudi Arabia',
                    'website' => 'www.gamma.com',
                    'country' => 'Saudi Arabia',
                    'city' => 'Dammam',
                    'postal_code' => '31261',
                    'currency_id' => $sarCurrencyId,
                    'vat_no' => '300345678900005',
                    'cr_no' => '1010456789',
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
                    'contact_number' => '+966504567890',
                    'address' => 'Al Salam Road, Medina, Saudi Arabia',
                    'website' => 'www.delta.com',
                    'country' => 'Saudi Arabia',
                    'city' => 'Medina',
                    'postal_code' => '42311',
                    'currency_id' => $sarCurrencyId,
                    'vat_no' => '300456789000006',
                    'cr_no' => '1010567890',
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
                    'contact_number' => '+966505678901',
                    'address' => 'Al Aziziyah, Mecca, Saudi Arabia',
                    'website' => 'www.epsilon.com',
                    'country' => 'Saudi Arabia',
                    'city' => 'Mecca',
                    'postal_code' => '24651',
                    'currency_id' => $sarCurrencyId,
                    'vat_no' => '300567890100007',
                    'cr_no' => '1010678901',
                    'account_name' => 'Epsilon Industries Ltd.',
                    'account_no' => '789-012345-004',
                    'license_no' => 'L-135790',
                    'iban' => 'SA0377777777789012345004',
                    'bank' => 'Arab National Bank',
                    'branch' => 'Mecca Financial Center',
                    'swift' => 'ARNBSARI',
                ],
            ];

            // Insert companies
            Company::insert($companies);
            
            DB::commit();
            $this->command->info('Companies inserted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error seeding companies: ' . $e->getMessage());
            throw $e;
        }
    }
}
