<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Step 1: Delete dependent records first
        DB::table('material_request_items')->whereIn('product_id', DB::table('products')->pluck('id'))->delete(); // Ensure related material_request_items are deleted
        DB::table('grn_receive_goods')->whereIn('category_id', ProductCategory::pluck('id'))->delete();
        DB::table('rfq_items')->whereIn('brand_id', DB::table('brands')->pluck('id'))->delete();
        DB::table('rfq_categories')->whereIn('category_id', ProductCategory::pluck('id'))->delete();
        DB::table('brands')->whereIn('category_id', ProductCategory::pluck('id'))->delete();

        // Step 2: Now delete product categories safely
        DB::table('product_categories')->delete();

        // Step 3: Insert categories with explicit IDs
        $categories = [
                ['id' => 1, 'name' => 'Electronics & Accessories'],
                ['id' => 2, 'name' => 'Computer Hardware'],
                ['id' => 3, 'name' => 'Computer Peripherals'],
                ['id' => 4, 'name' => 'Network Equipment'],
                ['id' => 5, 'name' => 'Mobile Devices & Accessories'],

                ['id' => 6, 'name' => 'Office Supplies'],
                ['id' => 7, 'name' => 'Office Furniture'],
                ['id' => 8, 'name' => 'Stationery'],
                ['id' => 9, 'name' => 'Printing & Imaging Supplies'],
                ['id' => 10, 'name' => 'Paper Products'],

                ['id' => 11, 'name' => 'Raw Materials'],
                ['id' => 12, 'name' => 'Industrial Machinery'],
                ['id' => 13, 'name' => 'Manufacturing Equipment'],
                ['id' => 14, 'name' => 'Industrial Tools'],
                ['id' => 15, 'name' => 'Industrial Safety Equipment'],

                ['id' => 16, 'name' => 'Automotive Parts'],
                ['id' => 17, 'name' => 'Automotive Accessories'],
                ['id' => 18, 'name' => 'Transportation Equipment'],
                ['id' => 19, 'name' => 'Tires & Wheels'],
                ['id' => 20, 'name' => 'Vehicle Maintenance'],

                ['id' => 21, 'name' => 'Building Materials'],
                ['id' => 22, 'name' => 'Construction Equipment'],
                ['id' => 23, 'name' => 'Hardware & Tools'],
                ['id' => 24, 'name' => 'Plumbing Supplies'],
                ['id' => 25, 'name' => 'Electrical Supplies'],

                ['id' => 26, 'name' => 'Medical Equipment'],
                ['id' => 27, 'name' => 'Medical Supplies'],
                ['id' => 28, 'name' => 'Pharmaceuticals'],
                ['id' => 29, 'name' => 'Laboratory Equipment'],
                ['id' => 30, 'name' => 'Dental Supplies'],

                ['id' => 31, 'name' => 'Food Products'],
                ['id' => 32, 'name' => 'Beverages'],
                ['id' => 33, 'name' => 'Food Processing Equipment'],
                ['id' => 34, 'name' => 'Catering Supplies'],
                ['id' => 35, 'name' => 'Restaurant Equipment'],

                ['id' => 36, 'name' => 'Clothing & Apparel'],
                ['id' => 37, 'name' => 'Footwear'],
                ['id' => 38, 'name' => 'Fabrics & Textiles'],
                ['id' => 39, 'name' => 'Fashion Accessories'],
                ['id' => 40, 'name' => 'Uniforms & Workwear'],

                ['id' => 41, 'name' => 'Home Appliances'],
                ['id' => 42, 'name' => 'Household Items'],
                ['id' => 43, 'name' => 'Home Furniture'],
                ['id' => 44, 'name' => 'Kitchen Supplies'],
                ['id' => 45, 'name' => 'Bedding & Linens'],

                ['id' => 46, 'name' => 'Industrial Chemicals'],
                ['id' => 47, 'name' => 'Laboratory Chemicals'],
                ['id' => 48, 'name' => 'Cleaning Supplies'],
                ['id' => 49, 'name' => 'Janitorial Equipment'],
                ['id' => 50, 'name' => 'Sanitization Products'],

                ['id' => 51, 'name' => 'Agricultural Equipment'],
                ['id' => 52, 'name' => 'Farming Tools'],
                ['id' => 53, 'name' => 'Seeds & Plants'],
                ['id' => 54, 'name' => 'Fertilizers & Pesticides'],
                ['id' => 55, 'name' => 'Irrigation Equipment'],

                ['id' => 56, 'name' => 'Packaging Materials'],
                ['id' => 57, 'name' => 'Shipping Supplies'],
                ['id' => 58, 'name' => 'Labels & Tags'],
                ['id' => 59, 'name' => 'Packaging Equipment'],
                ['id' => 60, 'name' => 'Storage Containers'],

                ['id' => 61, 'name' => 'Sports Equipment'],
                ['id' => 62, 'name' => 'Fitness Equipment'],
                ['id' => 63, 'name' => 'Outdoor Recreation'],
                ['id' => 64, 'name' => 'Sports Apparel'],
                ['id' => 65, 'name' => 'Team Sports Supplies'],

                ['id' => 66, 'name' => 'Electrical Components'],
                ['id' => 67, 'name' => 'Lighting Equipment'],
                ['id' => 68, 'name' => 'HVAC Systems'],
                ['id' => 69, 'name' => 'Heating Equipment'],
                ['id' => 70, 'name' => 'Cooling Equipment'],

                ['id' => 71, 'name' => 'Power Generation Equipment'],
                ['id' => 72, 'name' => 'Renewable Energy Products'],
                ['id' => 73, 'name' => 'Utility Supplies'],
                ['id' => 74, 'name' => 'Water Treatment Equipment'],
                ['id' => 75, 'name' => 'Energy Monitoring Devices'],

                ['id' => 76, 'name' => 'Safety & Security Equipment'],
                ['id' => 77, 'name' => 'Educational Supplies'],
                ['id' => 78, 'name' => 'Art & Craft Supplies'],
                ['id' => 79, 'name' => 'Printing & Publishing Equipment'],
                ['id' => 80, 'name' => 'Specialty Services'],
            ];

            // Use upsert to insert or update based on ID
            ProductCategory::upsert($categories, ['id'], ['name']);
    }
}
