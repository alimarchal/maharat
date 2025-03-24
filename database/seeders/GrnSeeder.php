<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\Quotation;
use App\Models\PurchaseOrder;

class GrnSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure the GRNs table exists
        if (!Schema::hasTable('grns')) {
            $this->command->warn('The grns table does not exist. Skipping GrnSeeder.');
            return;
        }

        // Fetch valid Quotation and Purchase Order IDs
        $quotationIds = Quotation::pluck('id')->toArray();
        $purchaseOrderIds = PurchaseOrder::pluck('id')->toArray();

        if (empty($quotationIds) || empty($purchaseOrderIds)) {
            $this->command->warn('No quotations or purchase orders found. Skipping GrnSeeder.');
            return;
        }

        try {
            // Temporarily disable foreign key constraints
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Clear existing data
            DB::table('grns')->truncate();

            // Re-enable foreign key constraints
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            // Seed GRN records dynamically
            $grns = [];
            for ($i = 1; $i <= 3; $i++) {
                $grns[] = [
                    'user_id' => $i,
                    'grn_number' => 'GRN-' . date('Y') . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'quotation_id' => $quotationIds[array_rand($quotationIds)],
                    'purchase_order_id' => $purchaseOrderIds[array_rand($purchaseOrderIds)],
                    'quantity' => rand(50, 100),
                    'delivery_date' => Carbon::now()->subDays($i)->toDateString(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ];
            }

            // Insert into database
            DB::table('grns')->insert($grns);

            $this->command->info('GRNs seeded successfully.');
        } catch (\Exception $e) {
            // In case of error, ensure foreign key checks are re-enabled
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            $this->command->error('Error seeding GRNs: ' . $e->getMessage());
        }
    }
}
