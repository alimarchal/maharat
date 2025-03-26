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

        return [
            [
                'id' => 1,
                'name' => 'Customer 1',
                'client_code' => 'CUST-001',
                'type' => 'regular',
                'is_limited' => 0,
                'tax_number' => '123456789',
                'contact_number' => '+1234567890',
                'street_name' => 'Main Street',
                'city' => 'City 1',
                'state' => 'State 1',
                'zip_code' => '12345',
                'country_code' => 'PK',
                'account_name' => 'Customer 1 Account',
                'account_number' => '123456789',
                'iban' => 'PK1234567890',
                'swift_code' => 'ABC123',
                'bank_currency' => 'SAR',
                'preferred_payment_method' => 'Bank Transfer',
                'default_tax_rate' => 5.00,
                'is_tax_exempt' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 2,
                'name' => 'Customer 2',
                'client_code' => 'CUST-002',
                'type' => 'regular',
                'is_limited' => 0,
                'tax_number' => '987654321',
                'contact_number' => '+0987654321',
                'street_name' => 'Another Street',
                'city' => 'City 2',
                'state' => 'State 2',
                'zip_code' => '67890',
                'country_code' => 'PK',
                'account_name' => 'Customer 2 Account',
                'account_number' => '987654321',
                'iban' => 'PK9876543210',
                'swift_code' => 'XYZ987',
                'bank_currency' => 'SAR',
                'preferred_payment_method' => 'Credit Card',
                'default_tax_rate' => 10.00,
                'is_tax_exempt' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 3,
                'name' => 'Customer 3',
                'client_code' => 'CUST-003',
                'type' => 'regular',
                'is_limited' => 0,
                'tax_number' => '456789123',
                'contact_number' => '+1122334455',
                'street_name' => 'New Street',
                'city' => 'City 3',
                'state' => 'State 3',
                'zip_code' => '11223',
                'country_code' => 'PK',
                'account_name' => 'Customer 3 Account',
                'account_number' => '456789123',
                'iban' => 'PK4567891230',
                'swift_code' => 'DEF456',
                'bank_currency' => 'SAR',
                'preferred_payment_method' => 'Cash',
                'default_tax_rate' => 8.00,
                'is_tax_exempt' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];
    }
}
