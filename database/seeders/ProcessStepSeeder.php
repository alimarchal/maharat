<?php

namespace Database\Seeders;

use App\Models\Process;
use App\Models\ProcessStep;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProcessStepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('process_steps')->delete(); 

        $process = Process::where('title', 'Material Request')->first();

        if (!$process) {
            throw new \Exception('Process not found. Run ProcessSeeder first.');
        }

        $steps = [
            [
                'process_id' => $process->id,
                'designation_id' => 5,
                'order' => 1,
                'description' => "Immediate Manager MR Approval Need from Supervisor",
                'is_active' => true,
                'timeout_days' => 2
            ],
            [
                'process_id' => $process->id,
                'designation_id' => 4,
                'order' => 2,
                'description' => "Immediate Manager MR Approval Need from Direct Manager",
                'is_active' => true,
                'timeout_days' => 2
            ],
            [
                'process_id' => $process->id,
                'designation_id' => 4,
                'order' => 3,
                'description' => "Immediate Manager MR Approval Need from Manager",
                'is_active' => true,
                'timeout_days' => 2
            ],
            [
                'process_id' => $process->id,
                'designation_id' => 4,
                'order' => 4,
                'description' => "Immediate Manager MR Approval Need from Department Director",
                'is_active' => true,
                'timeout_days' => 2
            ],
            [
                'process_id' => $process->id,
                'designation_id' => 4,
                'order' => 5,
                'description' => "Immediate Manager MR Approval Need from Warehouse Manager",
                'is_active' => true,
                'timeout_days' => 2
            ],
        ];

        foreach ($steps as $step) {
            ProcessStep::create($step);
        }
    }
}

