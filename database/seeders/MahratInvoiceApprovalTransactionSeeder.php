<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class MahratInvoiceApprovalTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Schema::hasTable('mahrat_invoice_approval_transactions')) {
            $this->command->warn('The mahrat_invoice_approval_transactions table does not exist. Skipping seeder.');
            return;
        }

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            // Reset AUTO_INCREMENT before starting transaction
            DB::statement('ALTER TABLE mahrat_invoice_approval_transactions AUTO_INCREMENT = 1');

            // Start transaction
            DB::beginTransaction();

            // Delete existing records
            DB::table('mahrat_invoice_approval_transactions')->delete();

            // Prepare data with consistent timestamp
            $now = now();
            $transactions = [
                [
                    'invoice_id' => 1,
                    'requester_id' => 1,
                    'assigned_to' => 5,
                    'referred_to' => null,
                    'order' => 1,
                    'description' => 'Initial approval request',
                    'status' => 'Pending',
                    'created_by' => 11,
                    'updated_by' => 11,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null
                ],
                [
                    'invoice_id' => 2,
                    'requester_id' => 5,
                    'assigned_to' => 8,
                    'referred_to' => 11,
                    'order' => 2,
                    'description' => 'Invoice needs clarification',
                    'status' => 'Refer',
                    'created_by' => 12,
                    'updated_by' => 12,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null
                ],
                [
                    'invoice_id' => 3,
                    'requester_id' => 6,
                    'assigned_to' => 9,
                    'referred_to' => null,
                    'order' => 3,
                    'description' => 'Invoice reviewed and approved',
                    'status' => 'Approve',
                    'created_by' => 10,
                    'updated_by' => 10,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null
                ],
                [
                    'invoice_id' => 4,
                    'requester_id' => 7,
                    'assigned_to' => 6,
                    'referred_to' => null,
                    'order' => 4,
                    'description' => 'Invoice rejected due to incorrect details',
                    'status' => 'Reject',
                    'created_by' => 8,
                    'updated_by' => 8,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null
                ],
                [
                    'invoice_id' => 5,
                    'requester_id' => 8,
                    'assigned_to' => 9,
                    'referred_to' => 5,
                    'order' => 2,
                    'description' => 'Referred for second review',
                    'status' => 'Refer',
                    'created_by' => 1,
                    'updated_by' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => null
                ],
            ];

            // Insert data
            DB::table('mahrat_invoice_approval_transactions')->insert($transactions);

            // Commit transaction
            DB::commit();
            $this->command->info('Mahrat Invoice Approval Transactions seeded successfully.');
            
        } catch (\Exception $e) {
            // Only rollback if there's an active transaction
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            $this->command->error('Error seeding transactions: ' . $e->getMessage());
            throw $e;
        } finally {
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
}
