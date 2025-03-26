<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExternalInvoice;
use Carbon\Carbon;

class ExternalInvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $invoices = [
            [
                'user_id' => 1,
                'purchase_order_id' => 201,
                'supplier_id' => 1,
                'invoice_id' => 'EXT-INV-0001',
                'amount' => 5000.00,
                'vat_amount' => 5000.00 * 0.15, // 15% VAT
                'status' => 'Verified',
                'type' => 'Cash',
                'payable_date' => Carbon::now()->addDays(30),
            ],
            [
                'user_id' => 2,
                'purchase_order_id' => 202,
                'supplier_id' => 2,
                'invoice_id' => 'EXT-INV-0002',
                'amount' => 7500.00,
                'vat_amount' => 7500.00 * 0.15,
                'status' => 'Paid',
                'type' => 'Credit',
                'payable_date' => Carbon::now()->addDays(15),
            ],
            [
                'user_id' => 3,
                'purchase_order_id' => 203,
                'supplier_id' => 3,
                'invoice_id' => 'EXT-INV-0003',
                'amount' => 3200.00,
                'vat_amount' => 3200.00 * 0.15,
                'status' => 'UnPaid',
                'type' => 'Cash',
                'payable_date' => Carbon::now()->addDays(20),
            ],
            
        ];

        foreach ($invoices as $invoice) {
            ExternalInvoice::create($invoice);
        }
    }
}
