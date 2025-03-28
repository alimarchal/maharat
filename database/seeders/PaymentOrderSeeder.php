<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            $this->command->info('Starting Payment Orders seeding...');
            
            // Begin transaction
            DB::beginTransaction();
            
            // Log the tables we need to clean
            $this->command->info('Cleaning related tables...');
            
            // Delete from child table first
            $this->command->info('Deleting from payment_order_approval_transactions...');
            DB::table('payment_order_approval_transactions')->delete();
            
            // Then delete from payment_orders
            $this->command->info('Deleting from payment_orders...');
            DB::table('payment_orders')->delete();

            $this->command->info('Inserting new payment orders...');
            
            // Insert sample records
            DB::table('payment_orders')->insert([
                [
                    'user_id' => 1,
                    'purchase_order_id' => 201,
                    'payment_order_number' => 'PO-20250301',
                    'date' => '2025-03-01',
                    'attachment' => 'payment_receipt_1.pdf',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => 2,
                    'purchase_order_id' => 202,
                    'payment_order_number' => 'PO-20250302',
                    'date' => '2025-03-02',
                    'attachment' => 'payment_receipt_2.pdf',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => 3,
                    'purchase_order_id' => 203,
                    'payment_order_number' => 'PO-20250303',
                    'date' => '2025-03-03',
                    'attachment' => 'payment_receipt_3.pdf',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);

            DB::commit();
            $this->command->info('Payment Orders seeded successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PaymentOrderSeeder failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            $this->command->error('Failed to seed Payment Orders: ' . $e->getMessage());
            throw $e;
        }
    }
}
