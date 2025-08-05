<?php

namespace Database\Seeders;

use App\Models\NotificationType;
use Illuminate\Database\Seeder;

class NotificationTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Material Request', 'key' => 'material_request', 'description' => 'Material request process notifications'],
            ['name' => 'RFQ Approval', 'key' => 'rfq_approval', 'description' => 'Request for quotation approval process notifications'],
            ['name' => 'Purchase Order Approval', 'key' => 'purchase_order_approval', 'description' => 'Purchase order approval process notifications'],
            ['name' => 'Maharat Invoice Approval', 'key' => 'maharat_invoice_approval', 'description' => 'Maharat invoice approval process notifications'],
            ['name' => 'Payment Order Approval', 'key' => 'payment_order_approval', 'description' => 'Payment order approval process notifications'],
            ['name' => 'Budget Request Approval', 'key' => 'budget_request_approval', 'description' => 'Budget request approval process notifications'],
            ['name' => 'Total Budget Approval', 'key' => 'total_budget_approval', 'description' => 'Total budget approval process notifications'],
        ];

        foreach ($types as $type) {
            NotificationType::firstOrCreate(
                ['key' => $type['key']],
                $type
            );
        }
    }
}
