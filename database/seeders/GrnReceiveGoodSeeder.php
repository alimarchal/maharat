<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\Grn;

class GrnReceiveGoodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure the table exists
        if (!Schema::hasTable('grn_receive_goods')) {
            $this->command->warn('The grn_receive_goods table does not exist. Skipping GrnReceiveGoodSeeder.');
            return;
        }

        // Fetch referenced IDs dynamically
        $supplierIds = Supplier::pluck('id')->toArray();
        $purchaseOrderIds = PurchaseOrder::pluck('id')->toArray();
        $quotationIds = Quotation::pluck('id')->toArray();
        $grnIds = Grn::pluck('id')->toArray();

        // Ensure there are records to reference
        if (empty($supplierIds) || empty($purchaseOrderIds) || empty($quotationIds) || empty($grnIds)) {
            $this->command->warn('No valid records found. Skipping GrnReceiveGoodSeeder.');
            return;
        }

        try {
            // Clear existing data
            DB::table('grn_receive_goods')->truncate();

            // Sample records
            $grnReceiveGoods = [];
            for ($i = 1; $i <= 3; $i++) {
                $grnReceiveGoods[] = [
                    'user_id' => $i,
                    'supplier_id' => $supplierIds[array_rand($supplierIds)],
                    'purchase_order_id' => $purchaseOrderIds[array_rand($purchaseOrderIds)],
                    'quotation_id' => $quotationIds[array_rand($quotationIds)],
                    'quantity_quoted' => rand(10, 50),
                    'due_delivery_date' => Carbon::now()->addDays(rand(5, 15))->toDateString(),
                    'receiver_name' => ['John Doe', 'Jane Smith', 'Michael Johnson'][array_rand(['John Doe', 'Jane Smith', 'Michael Johnson'])],
                    'upc' => str_pad(rand(100000000000, 999999999999), 12, '0', STR_PAD_LEFT),
                    'category_id' => rand(1, 80),
                    'quantity_delivered' => rand(10, 50),
                    'delivery_date' => Carbon::now()->subDays(rand(1, 10))->toDateString(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ];
            }

            // Insert data
            DB::table('grn_receive_goods')->insert($grnReceiveGoods);
            
            $this->command->info('GRN Receive Goods seeded successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error seeding GRN Receive Goods: ' . $e->getMessage());
        }
    }
}
