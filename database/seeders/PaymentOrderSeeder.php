<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PaymentOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            $this->command->info('Starting Payment Orders seeding...');
            
            // Log the tables we need to clean
            $this->command->info('Cleaning related tables...');
            
            // Check if tables exist
            if (!Schema::hasTable('payment_orders') || !Schema::hasTable('payment_order_approval_transactions')) {
                $this->command->warn('Required tables do not exist. Skipping PaymentOrderSeeder.');
                return;
            }

            // Temporarily disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            
            // Delete from child table first
            $this->command->info('Deleting from payment_order_approval_transactions...');
            DB::table('payment_order_approval_transactions')->truncate();
            
            // Then delete from payment_orders
            $this->command->info('Deleting from payment_orders...');
            DB::table('payment_orders')->truncate();

            // Reset auto-increment counters
            DB::statement('ALTER TABLE payment_orders AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE payment_order_approval_transactions AUTO_INCREMENT = 1');

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $this->command->info('Inserting new payment orders...');
            
            // Check if users exist
            $users = DB::table('users')->pluck('id')->toArray();
            if (empty($users)) {
                $this->command->warn('No users found. Please run UserSeeder first.');
                return;
            }

            // Check if purchase orders exist
            $purchaseOrders = DB::table('purchase_orders')->pluck('id')->toArray();
            if (empty($purchaseOrders)) {
                $this->command->warn('No purchase orders found. Please run PurchaseOrderSeeder first.');
                return;
            }
            
            // Insert sample records
            DB::table('payment_orders')->insert([
                [
                    'user_id' => $users[0] ?? 1,
                    'purchase_order_id' => $purchaseOrders[0] ?? 1,
                    'payment_order_number' => 'PO-20250301',
                    'date' => '2025-03-01',
                    'attachment' => 'payment_receipt_1.pdf',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $users[1] ?? 2,
                    'purchase_order_id' => $purchaseOrders[1] ?? 2,
                    'payment_order_number' => 'PO-20250302',
                    'date' => '2025-03-02',
                    'attachment' => 'payment_receipt_2.pdf',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $users[2] ?? 3,
                    'purchase_order_id' => $purchaseOrders[2] ?? 3,
                    'payment_order_number' => 'PO-20250303',
                    'date' => '2025-03-03',
                    'attachment' => 'payment_receipt_3.pdf',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);

            $this->command->info('Payment Orders seeded successfully.');
            
        } catch (\Exception $e) {
            // Ensure foreign key checks are re-enabled even if there's an error
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            
            Log::error('PaymentOrderSeeder failed: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            $this->command->error('Failed to seed Payment Orders: ' . $e->getMessage());
            throw $e;
        }
    }
}
