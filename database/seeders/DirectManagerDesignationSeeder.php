<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Designation;

class DirectManagerDesignationSeeder extends Seeder
{
    public function run(): void
    {
        Designation::firstOrCreate(['designation' => 'Direct Manager']);
    }
}


