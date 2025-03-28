<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentOrderApprovalTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate the table to remove existing data
        DB::table('payment_order_approval_transactions')->truncate();

        // Insert sample records
        DB::table('payment_order_approval_transactions')->insert([
            [
                'payment_order_id' => 1,
                'requester_id' => 1,
                'assigned_to' => 2,
                'referred_to' => 3,
                'order' => 1,
                'description' => 'Initial approval for payment order PO-20250301',
                'status' => 'Pending',
                'created_by' => 1,
                'updated_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'payment_order_id' => 2,
                'requester_id' => 2,
                'assigned_to' => 3,
                'referred_to' => 4,
                'order' => 2,
                'description' => 'Second-level approval for payment order PO-20250302',
                'status' => 'Approve',
                'created_by' => 2,
                'updated_by' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'payment_order_id' => 3,
                'requester_id' => 3,
                'assigned_to' => 4,
                'referred_to' => null,
                'order' => 3,
                'description' => 'Final approval for payment order PO-20250303',
                'status' => 'Reject',
                'created_by' => 3,
                'updated_by' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('Payment Order Approval Transactions seeded successfully.');
    }
}
