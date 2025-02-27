<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'Tech Solutions Ltd.',
                'code' => 'SUP-001',
                'email' => 'contact@techsolutions.com',
                'phone' => '123-456-7890',
                'website' => 'https://www.techsolutions.com',
                'tax_number' => 'VAT123456',
                'payment_terms' => 'Net 30 days',
                'is_approved' => 1,
                'currency_id' => 1,
                'status_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Office Essentials Inc.',
                'code' => 'SUP-002',
                'email' => 'info@officeessentials.com',
                'phone' => '987-654-3210',
                'website' => 'https://www.officeessentials.com',
                'tax_number' => 'VAT654321',
                'payment_terms' => 'Net 45 days',
                'is_approved' => 1,
                'currency_id' => 1,
                'status_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Global Supplies Co.',
                'code' => 'SUP-003',
                'email' => 'sales@globalsupplies.com',
                'phone' => '456-789-1234',
                'website' => 'https://www.globalsupplies.com',
                'tax_number' => 'VAT789123',
                'payment_terms' => 'Net 60 days',
                'is_approved' => 1,
                'currency_id' => 1,
                'status_id' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        Supplier::insert($suppliers);
    }
}
