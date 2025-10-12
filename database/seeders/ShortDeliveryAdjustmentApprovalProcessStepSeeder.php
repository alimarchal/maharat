<?php

namespace Database\Seeders;

use App\Models\Process;
use App\Models\ProcessStep;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShortDeliveryAdjustmentApprovalProcessStepSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $process = Process::where('title', 'Short Delivery Adjustment Approval')->first();

        if (!$process) {
            $this->command->error('Short Delivery Adjustment Approval process not found. Run ProcessSeeder first.');
            return;
        }

        // Clear existing steps for this process
        ProcessStep::where('process_id', $process->id)->delete();

        $steps = [
            [
                'process_id' => $process->id,
                'designation_id' => 4, // Direct Manager designation
                'order' => 1,
                'description' => "Direct Manager approval for short delivery adjustment",
                'is_active' => true,
                'timeout_days' => 2,
                'created_by' => 1,
                'updated_by' => 1
            ],
            [
                'process_id' => $process->id,
                'designation_id' => 3, // Manager designation
                'order' => 2,
                'description' => "Manager approval for short delivery adjustment",
                'is_active' => true,
                'timeout_days' => 2,
                'created_by' => 1,
                'updated_by' => 1
            ],
        ];

        foreach ($steps as $step) {
            ProcessStep::create($step);
        }

        $this->command->info('Short Delivery Adjustment Approval process steps created successfully.');
    }
}
