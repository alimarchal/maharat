<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('customers')) {
            $this->command->warn('The customers table does not exist. Skipping CustomerSeeder.');
            return;
        }

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            // Reset AUTO_INCREMENT before starting transaction
            DB::statement('ALTER TABLE customers AUTO_INCREMENT = 1');

            // Start transaction
            DB::beginTransaction();

            // Delete related records first
            if (Schema::hasTable('mahrat_invoice_approval_transactions')) {
                DB::table('mahrat_invoice_approval_transactions')
                    ->whereIn('invoice_id', function($query) {
                        $query->select('id')->from('invoices');
                    })
                    ->delete();
            }



            // Delete customers
            DB::table('customers')->delete();

            // Insert fresh customer data
            $customers = $this->getCustomersData();
            DB::table('customers')->insert($customers);

            // Commit transaction
            DB::commit();

            $this->command->info('Customers seeded successfully.');
            
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            $this->command->error('Error seeding customers: ' . $e->getMessage());
            throw $e;
        } finally {
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Get customers data array
     */
    private function getCustomersData(): array
    {
        $now = Carbon::now();

        $now = now();

    return [
        [
            'id' => 1,
            'name' => 'Al Rajhi Trading Co.',
            'email' => 'info@alrajhitrading.com',
            'client_code' => 'CUST-001',
            'type' => 'vendor',
            'is_limited' => false,
            'commercial_registration_number' => '1010123456', // KSA-style CRN
            'vat_number' => '300123456789003', // KSA VAT format
            'tax_group_registration_number' => 'TAXGR-1001',
            'cr_no' => 'CR-5001',
            'contact_number' => '+966112345678',
            'additional_number' => '+966551234567',
            'license_number' => 'LIC-10101',
            'address' => 'Olaya Street, Riyadh',
            'zip_code' => '12214',
            'country_code' => 'SA',
            'account_name' => 'Al Rajhi Trading Account',
            'account_number' => '101112223344',
            'iban' => 'SA031000000101112223344',
            'swift_code' => 'RJHISARI',
            'bank_name' => 'Al Rajhi Bank',
            'branch_name' => 'Riyadh Main Branch',
            'bank_currency' => 'SAR',
            'preferred_payment_method' => 'Bank Transfer',
            'default_tax_rate' => 15.00,
            'is_tax_exempt' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ],
        [
            'id' => 2,
            'name' => 'Saudi Industrial Supplies',
            'email' => 'sales@saudiindustrial.com',
            'client_code' => 'CUST-002',
            'type' => 'client',
            'is_limited' => true,
            'commercial_registration_number' => '2050654321',
            'vat_number' => '300987654321009',
            'tax_group_registration_number' => 'TAXGR-2002',
            'cr_no' => 'CR-5002',
            'contact_number' => '+966126543210',
            'additional_number' => null,
            'license_number' => 'LIC-20202',
            'address' => 'King Fahd Road, Jeddah',
            'zip_code' => '21442',
            'country_code' => 'SA',
            'account_name' => 'Saudi Industrial Supplies Account',
            'account_number' => '202334455667',
            'iban' => 'SA031000000202334455667',
            'swift_code' => 'NCBISARI',
            'bank_name' => 'Saudi National Bank (SNB)',
            'branch_name' => 'Jeddah Main Branch',
            'bank_currency' => 'SAR',
            'preferred_payment_method' => 'Credit Card',
            'default_tax_rate' => 5.00,
            'is_tax_exempt' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ],
        [
            'id' => 3,
            'name' => 'Dammam Logistics Services',
            'email' => 'logistics@dammamservices.com',
            'client_code' => 'CUST-003',
            'type' => 'both',
            'is_limited' => false,
            'commercial_registration_number' => '4030987654',
            'vat_number' => '300654321987006',
            'tax_group_registration_number' => 'TAXGR-3003',
            'cr_no' => 'CR-5003',
            'contact_number' => '+966135678901',
            'additional_number' => '+966555678901',
            'license_number' => 'LIC-30303',
            'address' => 'Prince Mohammed Bin Fahd Road, Dammam',
            'zip_code' => '32241',
            'country_code' => 'SA',
            'account_name' => 'Dammam Logistics Account',
            'account_number' => '303445566778',
            'iban' => 'SA031000000303445566778',
            'swift_code' => 'RIBLSARI',
            'bank_name' => 'Riyad Bank',
            'branch_name' => 'Dammam Branch',
            'bank_currency' => 'SAR',
            'preferred_payment_method' => 'Cash',
            'default_tax_rate' => 10.00,
            'is_tax_exempt' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ],
        [
            'id' => 4,
            'name' => 'Kingdom Electronics',
            'email' => 'support@kingdomelectronics.com',
            'client_code' => 'CUST-004',
            'type' => 'vendor',
            'is_limited' => false,
            'commercial_registration_number' => '1010987612',
            'vat_number' => '300312456789003',
            'tax_group_registration_number' => 'TAXGR-4004',
            'cr_no' => 'CR-5004',
            'contact_number' => '+966112987654',
            'additional_number' => null,
            'license_number' => 'LIC-40404',
            'address' => 'Tahlia Street, Riyadh',
            'zip_code' => '11564',
            'country_code' => 'SA',
            'account_name' => 'Kingdom Electronics Account',
            'account_number' => '404556677889',
            'iban' => 'SA031000000404556677889',
            'swift_code' => 'BSFRSARI',
            'bank_name' => 'Banque Saudi Fransi',
            'branch_name' => 'Riyadh Branch',
            'bank_currency' => 'SAR',
            'preferred_payment_method' => 'Bank Transfer',
            'default_tax_rate' => 15.00,
            'is_tax_exempt' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ],
        [
            'id' => 5,
            'name' => 'Medina Building Materials',
            'email' => 'sales@medinabuilding.com',
            'client_code' => 'CUST-005',
            'type' => 'client',
            'is_limited' => true,
            'commercial_registration_number' => '3098765432',
            'vat_number' => '300765432189004',
            'tax_group_registration_number' => 'TAXGR-5005',
            'cr_no' => 'CR-5005',
            'contact_number' => '+966148765432',
            'additional_number' => '+966556543210',
            'license_number' => 'LIC-50505',
            'address' => 'Quba Road, Medina',
            'zip_code' => '42311',
            'country_code' => 'SA',
            'account_name' => 'Medina Building Materials Account',
            'account_number' => '505667788990',
            'iban' => 'SA031000000505667788990',
            'swift_code' => 'SABBSAJE',
            'bank_name' => 'Saudi British Bank (SABB)',
            'branch_name' => 'Medina Branch',
            'bank_currency' => 'SAR',
            'preferred_payment_method' => 'Cheque',
            'default_tax_rate' => 12.00,
            'is_tax_exempt' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ],
    ];

    }
}
