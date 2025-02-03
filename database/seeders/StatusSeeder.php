<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $requests = [
            ['type' => 'Request', 'name' => 'Pending'],
            ['type' => 'Request', 'name' => 'Referred'],
            ['type' => 'Request', 'name' => 'Rejected'],
            ['type' => 'Request', 'name' => 'Approved'],
            ['type' => 'Inventory Adjustments Reason', 'name' => 'Expired'],
            ['type' => 'Inventory Adjustments Reason', 'name' => 'Discrepancy'],
            ['type' => 'Inventory Adjustments Reason', 'name' => 'Damaged'],
            ['type' => 'Inventory Adjustments Reason', 'name' => 'Other'],
            ['type' => 'Inventory Transfers Status', 'name' => 'Pending'],
            ['type' => 'Inventory Transfers Status', 'name' => 'In Transit'],
            ['type' => 'Inventory Transfers Status', 'name' => 'Completed'],
            ['type' => 'Inventory Transfers Status', 'name' => 'Cancelled'],
            ['type' => 'Serial Numbers Status', 'name' => 'Available'],
            ['type' => 'Serial Numbers Status', 'name' => 'Allocated'],
            ['type' => 'Serial Numbers Status', 'name' => 'Scrapped'],
            ['type' => 'Request For Material', 'name' => 'Normal'],
            ['type' => 'Request For Material', 'name' => 'Low'],
            ['type' => 'Request For Material', 'name' => 'High'],
            ['type' => 'Request For Material', 'name' => 'ASAP']
        ];

        foreach ($requests as $request) {
            Status::create($request);
        }
    }
}
