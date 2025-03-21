<?php

namespace Database\Seeders;

use App\Models\Quotation;
use App\Models\Rfq;
use App\Models\Supplier;
use App\Models\Status;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuotationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rfqs = Rfq::all();
        $suppliers = Supplier::all();
        $statuses = Status::where('type', 'Quotation Status')->get();

        if ($rfqs->isEmpty() || $suppliers->isEmpty() || $statuses->isEmpty()) {
            $this->command->warn('Skipping QuotationSeeder: RFQs, Suppliers, or Statuses table is empty.');
            return;
        }

        // Disable foreign key checks to delete records safely
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        // Delete all records in dependent tables first
        DB::table('grns')->delete();
        DB::table('purchase_orders')->delete();

        // Now delete records from quotations table
        DB::table('quotations')->delete();

        // Reset the auto-increment value to 1 to start fresh
        DB::statement('ALTER TABLE quotations AUTO_INCREMENT = 1');

        // Now we can insert records safely

        // Start quotation ID from 1
        $quotationId = 1;

        foreach ($rfqs as $rfq) {
            // Create 1-3 quotations per RFQ
            $numberOfQuotations = rand(1, 3);

            for ($i = 0; $i < $numberOfQuotations; $i++) {
                // Generate a unique quotation number
                $quotationNumber = 'QUO-' . date('Y') . '-' . str_pad($quotationId, 4, '0', STR_PAD_LEFT);

                Quotation::create([
                    'rfq_id' => $rfq->id,
                    'supplier_id' => $suppliers->random()->id ?? null,
                    'quotation_number' => $quotationNumber,
                    'issue_date' => $rfq->issue_date ?? now(),
                    'valid_until' => $rfq->closing_date,
                    'total_amount' => rand(1000, 50000),
                    'status_id' => collect(range(31, 35))->random(),
                    'terms_and_conditions' => 'Standard supplier terms and conditions apply',
                    'notes' => 'Sample quotation notes',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $quotationId++; // Increment ID
            }
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS = 1');

        $this->command->info('Quotations seeded successfully.');
    }
}
