<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CurrencySeeder::class,
            CountrySeeder::class,
            RoleAndPermissionSeeder::class,
            UserSeeder::class,
            StatusSeeder::class,
            RfqCategorySeeder::class,
            RfqSeeder::class,
            RfqItemSeeder::class,
            QuotationSeeder::class,
        ]);
        //php artisan db:seed
    }
}
