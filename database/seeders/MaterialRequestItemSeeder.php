<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaterialRequestItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete existing records to avoid duplicates
        DB::table('material_request_items')->truncate();

        // Sample material request items
        $materialRequestItems = [
            [
                'material_request_id' => 1,
                'product_id' => 201,
                'unit_id' => 1,
                'category_id' => 5,
                'quantity' => 10.0000,
                'urgency' => 2, 
                'description' => 'Request for 10 units of product 101',
                'photo' => 'uploads/products/product_101.jpg',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'material_request_id' => 2,
                'product_id' => 202,
                'unit_id' => 2,
                'category_id' => 3,
                'quantity' => 5.5000,
                'urgency' => 1, 
                'description' => 'Urgent request for 5.5 units of product 102',
                'photo' => 'uploads/products/product_102.jpg',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'material_request_id' => 3,
                'product_id' => 203,
                'unit_id' => 3,
                'category_id' => 7,
                'quantity' => 20.7500,
                'urgency' => 3, 
                'description' => 'Request for 20.75 units of product 103',
                'photo' => null, 
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        // Insert data into the database
        DB::table('material_request_items')->insert($materialRequestItems);
    }
}
