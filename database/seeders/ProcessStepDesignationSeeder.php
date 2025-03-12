<?php

namespace Database\Seeders;

use App\Models\ProcessStepDesignation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProcessStepDesignationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        DB::table('process_step_designations')->delete();
        $psd = [
            // Weight/Mass Units
            [
                'name' => 'Direct Manager',
            ],
            [
                'name' => 'Department Director',
            ],
            [
                'name' => 'Managing Director',
            ],
            [
                'name' => 'Manager',
            ],
            [
                'name' => 'Supervisor',
            ],
            [
                'name' => 'Warehouse Manager',
            ],
        ];

        foreach ($psd as $p) {
            ProcessStepDesignation::create($p);
        }
    }
}
