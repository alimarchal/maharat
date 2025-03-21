<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('purchase_orders')) {
            $this->command->warn('The purchase_orders table does not exist. Skipping PurchaseOrderSeeder.');
            return;
        }

        try {
            // Get all purchase_order IDs currently being referenced in grns
            $referencedPurchaseOrderIds = DB::table('grns')->pluck('purchase_order_id')->toArray();

            // Only delete purchase orders that are NOT referenced in grns
            DB::table('purchase_orders')->whereNotIn('id', $referencedPurchaseOrderIds)->delete();

            // Reset Auto Increment (Only if table is empty)
            if (DB::table('purchase_orders')->count() === 0) {
                DB::statement('ALTER TABLE purchase_orders AUTO_INCREMENT = 1');
            }

            // Sample purchase orders with explicit IDs
            $purchaseOrders = [
                [
                    'id' => 201,
                    'user_id' => 1,
                    'purchase_order_no' => 'PO-2025-0001',
                    'quotation_id' => 2,
                    'supplier_id' => 1,
                    'purchase_order_date' => '2025-03-10',
                    'expiry_date' => '2025-03-15',
                    'amount' => 15000.00,
                    'attachment' => null,
                    'original_name' => null,
                    'status' => 'Approved',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 202,
                    'user_id' => 2,
                    'purchase_order_no' => 'PO-2025-0002',
                    'quotation_id' => 4,
                    'supplier_id' => 2,
                    'purchase_order_date' => '2025-03-11',
                    'expiry_date' => '2025-03-16',
                    'amount' => 7500.50,
                    'attachment' => null,
                    'original_name' => null,
                    'status' => 'Draft',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 203,
                    'user_id' => 3,
                    'purchase_order_no' => 'PO-2025-0003',
                    'quotation_id' => 6,
                    'supplier_id' => 3,
                    'purchase_order_date' => '2025-03-12',
                    'expiry_date' => '2025-03-16',
                    'amount' => 20000.00,
                    'attachment' => null, 
                    'original_name' => null,
                    'status' => 'Rejected',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Use upsert to avoid duplicate ID errors
            DB::table('purchase_orders')->upsert($purchaseOrders, ['id'], [
                'user_id', 'purchase_order_no', 'quotation_id', 'supplier_id', 
                'purchase_order_date', 'expiry_date', 'amount', 'attachment', 'original_name', 'status', 'created_at', 'updated_at'
            ]);

            $this->command->info('Purchase orders seeded successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error seeding purchase orders: ' . $e->getMessage());
        }
    }

}
