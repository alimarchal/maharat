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
        // Check if required tables exist
        if (!Schema::hasTable('customers')) {
            $this->command->warn('The customers table does not exist. Skipping CustomerSeeder.');
            return;
        }

        try {
            // Delete child records from dependent tables safely if they exist
            if (Schema::hasTable('invoices')) {
                DB::table('invoices')->whereNotNull('client_id')->delete();
            }

            // Delete the parent records from the customers table
            DB::table('customers')->delete();

            // Reset AUTO_INCREMENT for the customers table if on MySQL
            try {
                DB::statement('ALTER TABLE customers AUTO_INCREMENT = 1');
            } catch (\Exception $e) {
                // Ignore errors on databases that don't support this statement
                $this->command->warn('Could not reset AUTO_INCREMENT on customers table. Continuing anyway.');
            }

            // Insert fresh customer data with explicit IDs for reliable references
            $customers = [
                [
                    'id' => 1, // Explicit ID for reference in other seeders
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
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
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
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
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
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Insert customer data into the database
            DB::table('customers')->insert($customers);

            $this->command->info('Customers seeded successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error seeding customers: ' . $e->getMessage());
            throw $e; // Re-throw to let Laravel's seeder know there was an error
        }
    }
}
