<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, delete all existing notification types
        DB::table('notification_types')->delete();
        
        // Insert the new process flow notification types
        $processFlowTypes = [
            [
                'name' => 'Material Request',
                'key' => 'material_request',
                'description' => 'Material request process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'RFQ Approval',
                'key' => 'rfq_approval',
                'description' => 'Request for quotation approval process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Purchase Order Approval',
                'key' => 'purchase_order_approval',
                'description' => 'Purchase order approval process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Maharat Invoice Approval',
                'key' => 'maharat_invoice_approval',
                'description' => 'Maharat invoice approval process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Payment Order Approval',
                'key' => 'payment_order_approval',
                'description' => 'Payment order approval process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Budget Request Approval',
                'key' => 'budget_request_approval',
                'description' => 'Budget request approval process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Total Budget Approval',
                'key' => 'total_budget_approval',
                'description' => 'Total budget approval process notifications',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('notification_types')->insert($processFlowTypes);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete the new process flow notification types
        DB::table('notification_types')->whereIn('key', [
            'material_request',
            'rfq_approval',
            'purchase_order_approval',
            'maharat_invoice_approval',
            'payment_order_approval',
            'budget_request_approval',
            'total_budget_approval',
        ])->delete();

        // Restore the original notification types
        $originalTypes = [
            [
                'name' => 'RFQ document',
                'key' => 'rfq_document',
                'description' => 'Request for quotation documents',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Quotations document',
                'key' => 'quotations_document',
                'description' => 'Quotation documents',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Goods Receiving Notes documents',
                'key' => 'goods_receiving_notes',
                'description' => 'Goods receiving notes',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'MRs documents',
                'key' => 'mrs_documents',
                'description' => 'Material requisition documents',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Invoices documents',
                'key' => 'invoices_documents',
                'description' => 'Invoice documents',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PMNTOs documents',
                'key' => 'pmntos_documents',
                'description' => 'Payment documents',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('notification_types')->insert($originalTypes);
    }
};
