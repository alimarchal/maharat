<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            StatusSeeder::class,
            CurrencySeeder::class,
            CountrySeeder::class,
            RoleAndPermissionSeeder::class,
            CompanySeeder::class,
            DepartmentSeeder::class,
            DesignationSeeder::class,
            UserSeeder::class,
            SupplierSeeder::class,
            ProductCategorySeeder::class,
            RfqCategorySeeder::class,
            UnitSeeder::class,
            BrandSeeder::class,
            RfqSeeder::class,
            RfqItemSeeder::class,
            QuotationSeeder::class,
        ]);
    }
}
