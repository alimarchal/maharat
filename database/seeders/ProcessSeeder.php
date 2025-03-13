<?php

namespace Database\Seeders;

use App\Models\Process;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\DB;

class ProcessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('processes')->delete(); 

        Process::updateOrCreate(
            ['id' => 1], 
            [
                'title' => 'Material Request',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ]
        );
    }
}

