<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete dependent records first to avoid foreign key constraint errors
        DB::table('invoice_items')->delete(); // or truncate, if needed
       
        // Now delete the main table records
        DB::table('invoices')->delete();  // Use delete instead of truncate

        // Reset Auto Increment (Only if table is empty)
        if (DB::table('invoices')->count() === 0) {
            DB::statement('ALTER TABLE invoices AUTO_INCREMENT = 1');
        }

        // Sample invoice records
        $invoices = [
            [
                'invoice_number' => 'INV-00001',
                'vendor_id' => 1,
                'client_id' => 1,
                'status' => 'Draft',
                'payment_method' => 'Bank Transfer',
                'issue_date' => '2025-03-10',
                'due_date' => '2025-03-20',
                'discounted_days' => 5,
                'subtotal' => 5000.00,
                'tax_amount' => 250.00,
                'total_amount' => 5250.00,
                'currency' => 'SAR',
                'notes' => 'Initial invoice for Q1 services',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'invoice_number' => 'INV-00002',
                'vendor_id' => 2,
                'client_id' => 2,
                'status' => 'Draft',
                'payment_method' => 'Credit Card',
                'issue_date' => '2025-03-11',
                'due_date' => '2025-03-21',
                'discounted_days' => 3,
                'subtotal' => 7500.00,
                'tax_amount' => 375.00,
                'total_amount' => 7875.00,
                'currency' => 'SAR',
                'notes' => 'Web development project invoice',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'invoice_number' => 'INV-00003',
                'vendor_id' => 3,
                'client_id' => 3,
                'status' => 'Draft',
                'payment_method' => 'Cash',
                'issue_date' => '2025-03-12',
                'due_date' => '2025-03-22',
                'discounted_days' => 7,
                'subtotal' => 3200.00,
                'tax_amount' => 160.00,
                'total_amount' => 3360.00,
                'currency' => 'SAR',
                'notes' => 'Consultation services invoice',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data into the database
        DB::table('invoices')->insert($invoices);
    }
}
