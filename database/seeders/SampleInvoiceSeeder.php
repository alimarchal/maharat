<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SampleInvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Create vendor customer (Skills Center for Construction Training)
        $vendorId = DB::table('customers')->insertGetId([
            // Basic information
            'name' => 'Skills Center for Construction Training',
            'commercial_registration_number' => '2050107792',
            'tax_number' => '310180207300003',
            'tax_group_registration_number' => '310180207300003',
            'contact_number' => '966-0546710828',
            'license_number' => 'L 310522',
            'type' => 'vendor',

            // Address fields
            'street_name' => 'Ali Bin Abi Talib',
            'building_number' => '4342',
            'address_additional_number' => '7831',
            'district' => 'Shamaliyah District',
            'city' => 'Nairiyah',
            'state' => 'SA',
            'zip_code' => '31981',
            'country_code' => 'SA',

            // Bank account fields
            'account_name' => 'MAHARAT CONSTRUCTION TRAINING CENTER (MCTC)',
            'account_number' => '242-089787-001',
            'iban' => 'SA0345000000242089787001',
            'swift_code' => 'SABBSARI',
            'branch_name' => 'Khobar Main Branch',
            'bank_currency' => 'SAR',

            // Payment and tax preferences
            'preferred_payment_method' => 'Bank Transfer',
            'default_tax_rate' => 15.00,
            'is_tax_exempt' => false,

            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create client customer (Hyundai Engineering Company Branch)
        $clientId = DB::table('customers')->insertGetId([
            // Basic information
            'name' => 'Hyundai Engineering Company Branch',
            'commercial_registration_number' => '2050107793', // Changed to be unique
            'tax_number' => '300467376500003',
            'client_code' => '41',
            'additional_number' => '6412',
            'is_limited' => true,
            'type' => 'client',

            // Address fields
            'street_name' => 'Al Waleed Bin Salama Road',
            'building_number' => '4093',
            'district' => 'Khalidiyah Ash',
            'neighborhood' => 'the main street',
            'city' => 'Dammam',
            'state' => 'SA',
            'zip_code' => '32232',
            'country_code' => 'SA',

            // Payment and tax preferences
            'preferred_payment_method' => 'Bank Transfer',
            'default_tax_rate' => 15.00,
            'is_tax_exempt' => false,

            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create invoice
        $invoiceId = DB::table('invoices')->insertGetId([
            'invoice_number' => '0004-28',
            'vendor_id' => $vendorId,
            'client_id' => $clientId,
            'status' => 'Sent',
            'payment_method' => 'Okay', // As shown in the invoice
            'issue_date' => '2025-02-28',
            'discounted_days' => 30,
            'subtotal' => 126000.00,
            'tax_amount' => 18900.00,
            'total_amount' => 144900.00,
            'currency' => 'SAR',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create invoice item
        DB::table('invoice_items')->insert([
            'invoice_id' => $invoiceId,
            'name' => 'Training Fee for the Month of Feb 2025 for 6th Intake',
            'description' => 'Monthly training fee',
            'quantity' => 30.00,
            'unit_price' => 4200.00,
            'tax_rate' => 15.00,
            'tax_amount' => 18900.00,
            'subtotal' => 126000.00,
            'total' => 144900.00,
            'identification' => '1 training fee',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
