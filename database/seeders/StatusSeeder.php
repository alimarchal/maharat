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
            ['type' => 'Request', 'name' => 'Draft'],
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
            ['type' => 'Urgency', 'name' => 'Normal'],
            ['type' => 'Urgency', 'name' => 'LOW'],
            ['type' => 'Urgency', 'name' => 'Normal'],
            ['type' => 'Urgency', 'name' => 'Normal'],

            ['type' => 'Purchase RFQ Status', 'name' => 'Active'],
            ['type' => 'Purchase RFQ Status', 'name' => 'Pending'],
            ['type' => 'Purchase RFQ Status', 'name' => 'Rejected'],
            ['type' => 'Purchase RFQ Status', 'name' => 'Expired'],

            // New RFQ Request Types
            ['type' => 'RFQ Request Type', 'name' => 'Single Category'],
            ['type' => 'RFQ Request Type', 'name' => 'Multiple Category'],

            ['type' => 'Request', 'name' => 'Pending'],
            ['type' => 'Request', 'name' => 'Referred'],
            ['type' => 'Request', 'name' => 'Rejected'],
            ['type' => 'Request', 'name' => 'Approved'],




            ['type' => 'Quotation Status', 'name' => 'Pending'], 
            ['type' => 'Quotation Status', 'name' => 'Active'],
            ['type' => 'Quotation Status', 'name' => 'Rejected'],
            ['type' => 'Quotation Status', 'name' => 'Expired'],
            ['type' => 'Quotation Status', 'name' => 'Approved'],

            ['type' => 'Workflow Material Request', 'name' => 'Normal Purchase Process'],
            ['type' => 'Workflow Material Request', 'name' => 'Single Source Purchase Process'],
            ['type' => 'Workflow Material Request', 'name' => 'User Request Purchase'],
            ['type' => 'Workflow Material Request', 'name' => 'Purchase'],
            ['type' => 'Workflow Material Request', 'name' => 'RFQ Purchase'],
            ['type' => 'Workflow Material Request', 'name' => 'Request for Material'],

            ['type' => 'RFQ Request Type ', 'name' => 'Request for Material'],

            // RFQ Status
            ['type' => 'Payment', 'name' => 'Cash'],
            ['type' => 'Payment', 'name' => 'Credit upto 30 days'],
            ['type' => 'Payment', 'name' => 'Credit up to 60 days'],
            ['type' => 'Payment', 'name' => 'Credit upto 90 days'],
            ['type' => 'Payment', 'name' => 'Credit upto 120 days'],
            ['type' => 'RFQ Status', 'name' => 'Active'],
            ['type' => 'RFQ Status', 'name' => 'Pending'],
            ['type' => 'RFQ Status', 'name' => 'Rejected'],
            ['type' => 'RFQ Status', 'name' => 'Expired'],

        ];

        foreach ($requests as $request) {
            Status::create($request);
        }
    }
}
