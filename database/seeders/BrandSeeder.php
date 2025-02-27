<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\ProductCategory;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $category = ProductCategory::first();

        if (!$category) {
            $this->command->error('No categories found. Run ProductCategorySeeder first.');
            return;
        }

        $brands = [
            ['name' => 'Samsung', 'category_id' => $category->id],
            ['name' => 'Apple', 'category_id' => $category->id],
            ['name' => 'Dell', 'category_id' => $category->id],
            ['name' => 'HP', 'category_id' => $category->id],
            ['name' => 'Lenovo', 'category_id' => $category->id],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(
                ['name' => $brand['name']],
                [
                    'user_id' => 1,
                    'category_id' => $brand['category_id'],
                    'status_id' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

    }
}
