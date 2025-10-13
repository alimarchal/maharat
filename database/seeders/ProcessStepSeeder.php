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

        // Create steps for Short Delivery Adjustment Approval process
        $shortDeliveryProcess = Process::where('title', 'Short Delivery Adjustment Approval')->first();
        
        if ($shortDeliveryProcess) {
            $shortDeliverySteps = [
                [
                    'process_id' => $shortDeliveryProcess->id,
                    'designation_id' => 4, // Direct Manager
                    'order' => 1,
                    'description' => "Direct Manager Approval for Short Delivery Adjustment",
                    'is_active' => true,
                    'timeout_days' => 2
                ],
                [
                    'process_id' => $shortDeliveryProcess->id,
                    'designation_id' => 3, // Manager
                    'order' => 2,
                    'description' => "Manager Approval for Short Delivery Adjustment",
                    'is_active' => true,
                    'timeout_days' => 2
                ],
            ];

            foreach ($shortDeliverySteps as $step) {
                ProcessStep::create($step);
            }
        }
    }
}

