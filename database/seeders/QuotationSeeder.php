<?php

namespace Database\Seeders;

use App\Models\Quotation;
use App\Models\Rfq;
use App\Models\Supplier;
use App\Models\Status;
use Illuminate\Database\Seeder;

class QuotationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rfqs = Rfq::all();
        $suppliers = Supplier::all();
        $statuses = Status::where('type', 'quotation')->get();

        foreach ($rfqs as $rfq) {
            // Create 1-3 quotations per RFQ
            $numberOfQuotations = rand(1, 3);
            
            for ($i = 0; $i < $numberOfQuotations; $i++) {
                Quotation::create([
                    'rfq_id' => $rfq->id,
                    'supplier_id' => $suppliers->random()->id,
                    'quotation_number' => 'QUO-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
                    'issue_date' => $rfq->issue_date,
                    'valid_until' => $rfq->closing_date,
                    'total_amount' => rand(1000, 50000),
                    'status_id' => $statuses->random()->id,
                    'terms_and_conditions' => 'Standard supplier terms and conditions apply',
                    'notes' => 'Sample quotation notes',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
}
