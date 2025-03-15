<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InvoiceItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete existing records
        DB::table('invoice_items')->truncate();

        // Sample invoice items
        $invoiceItems = [
            [
                'invoice_id' => 1,
                'name' => 'Website Development',
                'description' => 'Development of a custom e-commerce website',
                'quantity' => 1.00,
                'unit_price' => 5000.00,
                'tax_rate' => 5.00,
                'tax_amount' => 250.00,
                'subtotal' => 5000.00,
                'total' => 5250.00,
                'identification' => 'WD-001',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'invoice_id' => 1,
                'name' => 'Hosting Service',
                'description' => 'One-year premium hosting service',
                'quantity' => 1.00,
                'unit_price' => 1200.00,
                'tax_rate' => 5.00,
                'tax_amount' => 60.00,
                'subtotal' => 1200.00,
                'total' => 1260.00,
                'identification' => 'HS-001',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'invoice_id' => 2,
                'name' => 'SEO Optimization',
                'description' => 'Monthly SEO optimization service',
                'quantity' => 1.00,
                'unit_price' => 800.00,
                'tax_rate' => 5.00,
                'tax_amount' => 40.00,
                'subtotal' => 800.00,
                'total' => 840.00,
                'identification' => 'SEO-001',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data into the database
        DB::table('invoice_items')->insert($invoiceItems);
    }
}
