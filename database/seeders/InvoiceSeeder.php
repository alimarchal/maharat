<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if tables exist
        if (!Schema::hasTable('invoices') || !Schema::hasTable('invoice_items')) {
            $this->command->warn('Required tables do not exist. Skipping InvoiceSeeder.');
            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            // Reset AUTO_INCREMENT before transaction
            DB::statement('ALTER TABLE invoices AUTO_INCREMENT = 1');

            DB::beginTransaction();

            // Clear existing data
            if (Schema::hasTable('invoice_items')) {
                DB::table('invoice_items')->delete();
            }
            DB::table('invoices')->delete();

            // Insert fresh invoice data
            $invoices = [
                [
                    'invoice_number' => 'INV-00001',
                    'vendor_id' => 1,
                    'client_id' => 1,
                    'status' => 'Draft',
                    'payment_method' => 'Bank Transfer',
                    'issue_date' => '2025-03-10',
                    'due_date' => '2025-03-20',
                    'discounted_days' => 5,
                    'subtotal' => 5000.00,
                    'tax_amount' => 250.00,
                    'total_amount' => 5250.00,
                    'currency' => 'SAR',
                    'notes' => 'Initial invoice for Q1 services',
                    'account_code_id' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'invoice_number' => 'INV-00002',
                    'vendor_id' => 2,
                    'client_id' => 2,
                    'status' => 'Draft',
                    'payment_method' => 'Credit Card',
                    'issue_date' => '2025-03-11',
                    'due_date' => '2025-03-21',
                    'discounted_days' => 3,
                    'subtotal' => 7500.00,
                    'tax_amount' => 375.00,
                    'total_amount' => 7875.00,
                    'currency' => 'SAR',
                    'notes' => 'Web development project invoice',
                    'account_code_id' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'invoice_number' => 'INV-00003',
                    'vendor_id' => 3,
                    'client_id' => 3,
                    'status' => 'Draft',
                    'payment_method' => 'Cash',
                    'issue_date' => '2025-03-12',
                    'due_date' => '2025-03-22',
                    'discounted_days' => 7,
                    'subtotal' => 3200.00,
                    'tax_amount' => 160.00,
                    'total_amount' => 3360.00,
                    'currency' => 'SAR',
                    'notes' => 'Consultation services invoice',
                    'account_code_id' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'invoice_number' => 'INV-00004',
                    'vendor_id' => 1,
                    'client_id' => 1,
                    'status' => 'Paid',
                    'payment_method' => 'Bank Transfer',
                    'issue_date' => '2025-03-13',
                    'due_date' => '2025-03-23',
                    'discounted_days' => 2,
                    'subtotal' => 10000.00,
                    'tax_amount' => 500.00,
                    'total_amount' => 10500.00,
                    'currency' => 'SAR',
                    'notes' => 'Software licensing invoice',
                    'account_code_id' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'invoice_number' => 'INV-00005',
                    'vendor_id' => 2,
                    'client_id' => 2,
                    'status' => 'Pending',
                    'payment_method' => 'Cash',
                    'issue_date' => '2025-03-14',
                    'due_date' => '2025-03-24',
                    'discounted_days' => 4,
                    'subtotal' => 6800.00,
                    'tax_amount' => 340.00,
                    'total_amount' => 7140.00,
                    'currency' => 'SAR',
                    'notes' => 'Marketing campaign invoice',
                    'account_code_id' => 4,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ];

            DB::table('invoices')->insert($invoices);

            DB::commit();
            $this->command->info('Invoices seeded successfully.');
            
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            $this->command->error('Error seeding invoices: ' . $e->getMessage());
            throw $e;
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
}
