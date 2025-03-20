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
        $data = [
            [
                'title' => 'Material Request',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'title' => 'RFQ Approval',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'title' => 'Purchase Order Approval',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'title' => 'Maharat Invoice Approval',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'title' => 'Payment Order Approval',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'title' => 'Budget Request Approval',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ],
            [
                'title' => 'Total Budget Approval',
                'status' => 'Active',
                'created_by' => 1,
                'updated_by' => 1,
            ]];

        foreach ($data as $item) {
            Process::create($item);
        }
    }
}

