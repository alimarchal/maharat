<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Check if required tables exist
        if (!Schema::hasTable('products') || !Schema::hasTable('product_categories') || !Schema::hasTable('units')) {
            $this->command->warn('Required tables do not exist. Skipping ProductSeeder.');
            return;
        }

        DB::beginTransaction();

        try {
            // Check if categories exist, create if they don't
            $categories = [
                'Mobile Devices & Accessories' => 5,
                'Office Supplies' => 6,
                'Computer Hardware' => 2
            ];

            $categoryIds = [];
            foreach ($categories as $category => $defaultId) {
                $categoryRecord = DB::table('product_categories')->where('name', $category)->first();
                if (!$categoryRecord) {
                    // Check if a record with the default ID exists
                    $idExists = DB::table('product_categories')->where('id', $defaultId)->exists();
                    
                    if (!$idExists) {
                        // Use the default ID if available
                        $categoryIds[$category] = DB::table('product_categories')->insertGetId([
                            'id' => $defaultId,
                            'name' => $category,
                            'created_at' => Carbon::now(),
                            'updated_at' => Carbon::now()
                        ]);
                    } else {
                        // Otherwise, let the database assign an ID
                        $categoryIds[$category] = DB::table('product_categories')->insertGetId([
                            'name' => $category,
                            'created_at' => Carbon::now(),
                            'updated_at' => Carbon::now()
                        ]);
                    }
                } else {
                    $categoryIds[$category] = $categoryRecord->id;
                }
            }

            // Fetch or create unit ID
            $unitRecord = DB::table('units')->where('name', 'Pieces')->first();
            if (!$unitRecord) {
                $unitId = DB::table('units')->insertGetId([
                    'id' => 1, // Use a fixed ID for consistency
                    'name' => 'Pieces',
                    'short_title' => 'PCs',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now()
                ]);
            } else {
                $unitId = $unitRecord->id;
            }

            // Define product data with explicit IDs
            $products = [
                [
                    'id' => 201, // Using explicit IDs referenced in other seeders
                    'category_id' => $categoryIds['Mobile Devices & Accessories'],
                    'unit_id' => $unitId,
                    'name' => 'Wireless Mouse',
                    'upc' => '123456789012',
                    'description' => 'A high-quality wireless mouse with ergonomic design.',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 202,
                    'category_id' => $categoryIds['Office Supplies'],
                    'unit_id' => $unitId,
                    'name' => 'Folders',
                    'upc' => '987654321098',
                    'description' => 'Adjustable aluminum clip folders.',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 203,
                    'category_id' => $categoryIds['Computer Hardware'],
                    'unit_id' => $unitId,
                    'name' => 'Gaming Keyboard',
                    'upc' => '456789123456',
                    'description' => 'Mechanical gaming keyboard with RGB backlight.',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ];

            // Delete any products with conflicting IDs or UPCs
            DB::table('products')
                ->whereIn('id', [201, 202, 203])
                ->orWhereIn('upc', array_column($products, 'upc'))
                ->delete();
                
            // Insert products
            DB::table('products')->insert($products);

            DB::commit();
            $this->command->info('Products seeded successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error seeding products: ' . $e->getMessage());
        }
    }
}