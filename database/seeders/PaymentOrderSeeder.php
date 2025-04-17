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

            // Get amounts from purchase orders if possible
            $purchaseOrderAmounts = [];
            foreach ($purchaseOrders as $poId) {
                $amount = DB::table('purchase_orders')->where('id', $poId)->value('amount') ?? (5000 + (1000 * $poId));
                $purchaseOrderAmounts[$poId] = $amount;
            }
            
            // Payment types
            $paymentTypes = ['Cash', 'Card', 'Bank Transfer', 'Cheque'];
            // Statuses
            $statuses = ['Draft', 'Approved', 'Overdue', 'Cancelled', 'Paid', 'Pending', 'Partially Paid'];
            
            // Insert sample records
            DB::table('payment_orders')->insert([
                [
                    'user_id' => $users[0] ?? 1,
                    'purchase_order_id' => $purchaseOrders[0] ?? 1,
                    'payment_order_number' => 'PMT-00001',
                    'issue_date' => '2025-03-01',
                    'due_date' => '2025-03-15',
                    'payment_type' => $paymentTypes[0],
                    'attachment' => 'payment_receipt_1.pdf',
                    'total_amount' => $purchaseOrderAmounts[$purchaseOrders[0] ?? 1] ?? 5000,
                    'paid_amount' => 5000,
                    'status' => 'Paid',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $users[1] ?? 2,
                    'purchase_order_id' => $purchaseOrders[1] ?? 2,
                    'payment_order_number' => 'PMT-00002',
                    'issue_date' => '2025-03-02',
                    'due_date' => '2025-03-20',
                    'payment_type' => $paymentTypes[2],
                    'attachment' => 'payment_receipt_2.pdf',
                    'total_amount' => $purchaseOrderAmounts[$purchaseOrders[1] ?? 2] ?? 6000,
                    'paid_amount' => 3000,
                    'status' => 'Partially Paid',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $users[2] ?? 3,
                    'purchase_order_id' => $purchaseOrders[2] ?? 3,
                    'payment_order_number' => 'PMT-00003',
                    'issue_date' => '2025-03-03',
                    'due_date' => '2025-04-03',
                    'payment_type' => $paymentTypes[3],
                    'attachment' => 'payment_receipt_3.pdf',
                    'total_amount' => $purchaseOrderAmounts[$purchaseOrders[2] ?? 3] ?? 7000,
                    'paid_amount' => 0,
                    'status' => 'Pending',
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
