<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('rfq_items')->whereIn('brand_id', DB::table('brands')->pluck('id'))->delete();
        DB::table('rfq_categories')->whereIn('category_id', ProductCategory::pluck('id'))->delete();
        DB::table('brands')->whereIn('category_id', ProductCategory::pluck('id'))->delete();
    
        DB::table('product_categories')->delete();

        $categories = [
            ['name' => 'Electronics & Accessories'],
            ['name' => 'Computer Hardware'],
            ['name' => 'Computer Peripherals'],
            ['name' => 'Network Equipment'],
            ['name' => 'Mobile Devices & Accessories'],

            ['name' => 'Office Supplies'],
            ['name' => 'Office Furniture'],
            ['name' => 'Stationery'],
            ['name' => 'Printing & Imaging Supplies'],
            ['name' => 'Paper Products'],

            ['name' => 'Raw Materials'],
            ['name' => 'Industrial Machinery'],
            ['name' => 'Manufacturing Equipment'],
            ['name' => 'Industrial Tools'],
            ['name' => 'Industrial Safety Equipment'],

            ['name' => 'Automotive Parts'],
            ['name' => 'Automotive Accessories'],
            ['name' => 'Transportation Equipment'],
            ['name' => 'Tires & Wheels'],
            ['name' => 'Vehicle Maintenance'],

            ['name' => 'Building Materials'],
            ['name' => 'Construction Equipment'],
            ['name' => 'Hardware & Tools'],
            ['name' => 'Plumbing Supplies'],
            ['name' => 'Electrical Supplies'],

            ['name' => 'Medical Equipment'],
            ['name' => 'Medical Supplies'],
            ['name' => 'Pharmaceuticals'],
            ['name' => 'Laboratory Equipment'],
            ['name' => 'Dental Supplies'],

            ['name' => 'Food Products'],
            ['name' => 'Beverages'],
            ['name' => 'Food Processing Equipment'],
            ['name' => 'Catering Supplies'],
            ['name' => 'Restaurant Equipment'],

            ['name' => 'Clothing & Apparel'],
            ['name' => 'Footwear'],
            ['name' => 'Fabrics & Textiles'],
            ['name' => 'Fashion Accessories'],
            ['name' => 'Uniforms & Workwear'],

            ['name' => 'Home Appliances'],
            ['name' => 'Household Items'],
            ['name' => 'Home Furniture'],
            ['name' => 'Kitchen Supplies'],
            ['name' => 'Bedding & Linens'],


            ['name' => 'Industrial Chemicals'],
            ['name' => 'Laboratory Chemicals'],
            ['name' => 'Cleaning Supplies'],
            ['name' => 'Janitorial Equipment'],
            ['name' => 'Sanitization Products'],

            ['name' => 'Agricultural Equipment'],
            ['name' => 'Farming Tools'],
            ['name' => 'Seeds & Plants'],
            ['name' => 'Fertilizers & Pesticides'],
            ['name' => 'Irrigation Equipment'],

            ['name' => 'Packaging Materials'],
            ['name' => 'Shipping Supplies'],
            ['name' => 'Labels & Tags'],
            ['name' => 'Packaging Equipment'],
            ['name' => 'Storage Containers'],

            ['name' => 'Sports Equipment'],
            ['name' => 'Fitness Equipment'],
            ['name' => 'Outdoor Recreation'],
            ['name' => 'Sports Apparel'],
            ['name' => 'Team Sports Supplies'],

            ['name' => 'Electrical Components'],
            ['name' => 'Lighting Equipment'],
            ['name' => 'HVAC Systems'],
            ['name' => 'Heating Equipment'],
            ['name' => 'Cooling Equipment'],

            ['name' => 'Power Generation Equipment'],
            ['name' => 'Renewable Energy Products'],
            ['name' => 'Utility Supplies'],
            ['name' => 'Water Treatment Equipment'],
            ['name' => 'Energy Monitoring Devices'],

            ['name' => 'Safety & Security Equipment'],
            ['name' => 'Educational Supplies'],
            ['name' => 'Art & Craft Supplies'],
            ['name' => 'Printing & Publishing Equipment'],
            ['name' => 'Specialty Services']
        ];

        foreach ($categories as $category) {
            ProductCategory::create($category);
        }
    }
}
