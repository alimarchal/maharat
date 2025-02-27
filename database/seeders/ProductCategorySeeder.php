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
        DB::table('product_categories')->delete();

        $categories = [
            // Electronics & IT
            ['name' => 'Electronics & Accessories'],
            ['name' => 'Computer Hardware'],
            ['name' => 'Computer Peripherals'],
            ['name' => 'Network Equipment'],
            ['name' => 'Mobile Devices & Accessories'],

            // Office & Business
            ['name' => 'Office Supplies'],
            ['name' => 'Office Furniture'],
            ['name' => 'Stationery'],
            ['name' => 'Printing & Imaging Supplies'],
            ['name' => 'Paper Products'],

            // Industrial & Manufacturing
            ['name' => 'Raw Materials'],
            ['name' => 'Industrial Machinery'],
            ['name' => 'Manufacturing Equipment'],
            ['name' => 'Industrial Tools'],
            ['name' => 'Industrial Safety Equipment'],

            // Automotive & Transportation
            ['name' => 'Automotive Parts'],
            ['name' => 'Automotive Accessories'],
            ['name' => 'Transportation Equipment'],
            ['name' => 'Tires & Wheels'],
            ['name' => 'Vehicle Maintenance'],

            // Construction & Building
            ['name' => 'Building Materials'],
            ['name' => 'Construction Equipment'],
            ['name' => 'Hardware & Tools'],
            ['name' => 'Plumbing Supplies'],
            ['name' => 'Electrical Supplies'],

            // Health & Medical
            ['name' => 'Medical Equipment'],
            ['name' => 'Medical Supplies'],
            ['name' => 'Pharmaceuticals'],
            ['name' => 'Laboratory Equipment'],
            ['name' => 'Dental Supplies'],

            // Food & Beverage
            ['name' => 'Food Products'],
            ['name' => 'Beverages'],
            ['name' => 'Food Processing Equipment'],
            ['name' => 'Catering Supplies'],
            ['name' => 'Restaurant Equipment'],

            // Apparel & Textiles
            ['name' => 'Clothing & Apparel'],
            ['name' => 'Footwear'],
            ['name' => 'Fabrics & Textiles'],
            ['name' => 'Fashion Accessories'],
            ['name' => 'Uniforms & Workwear'],

            // Home & Household
            ['name' => 'Home Appliances'],
            ['name' => 'Household Items'],
            ['name' => 'Home Furniture'],
            ['name' => 'Kitchen Supplies'],
            ['name' => 'Bedding & Linens'],

            // Chemical & Cleaning
            ['name' => 'Industrial Chemicals'],
            ['name' => 'Laboratory Chemicals'],
            ['name' => 'Cleaning Supplies'],
            ['name' => 'Janitorial Equipment'],
            ['name' => 'Sanitization Products'],

            // Agriculture & Farming
            ['name' => 'Agricultural Equipment'],
            ['name' => 'Farming Tools'],
            ['name' => 'Seeds & Plants'],
            ['name' => 'Fertilizers & Pesticides'],
            ['name' => 'Irrigation Equipment'],

            // Packaging & Shipping
            ['name' => 'Packaging Materials'],
            ['name' => 'Shipping Supplies'],
            ['name' => 'Labels & Tags'],
            ['name' => 'Packaging Equipment'],
            ['name' => 'Storage Containers'],

            // Sports & Recreation
            ['name' => 'Sports Equipment'],
            ['name' => 'Fitness Equipment'],
            ['name' => 'Outdoor Recreation'],
            ['name' => 'Sports Apparel'],
            ['name' => 'Team Sports Supplies'],

            // Electrical & HVAC
            ['name' => 'Electrical Components'],
            ['name' => 'Lighting Equipment'],
            ['name' => 'HVAC Systems'],
            ['name' => 'Heating Equipment'],
            ['name' => 'Cooling Equipment'],

            // Energy & Utilities
            ['name' => 'Power Generation Equipment'],
            ['name' => 'Renewable Energy Products'],
            ['name' => 'Utility Supplies'],
            ['name' => 'Water Treatment Equipment'],
            ['name' => 'Energy Monitoring Devices'],

            // Specialty & Miscellaneous
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
