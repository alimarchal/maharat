<?php

namespace Database\Seeders;

use App\Models\NotificationType;
use Illuminate\Database\Seeder;

class NotificationTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'RFQ document', 'key' => 'rfq_document', 'description' => 'Request for quotation documents'],
            ['name' => 'Quotations document', 'key' => 'quotations_document', 'description' => 'Quotation documents'],
            ['name' => 'Goods Receiving Notes documents', 'key' => 'goods_receiving_notes', 'description' => 'Goods receiving notes'],
            ['name' => 'MRs documents', 'key' => 'mrs_documents', 'description' => 'Material requisition documents'],
            ['name' => 'Invoices documents', 'key' => 'invoices_documents', 'description' => 'Invoice documents'],
            ['name' => 'PMNTOs documents', 'key' => 'pmntos_documents', 'description' => 'Payment documents'],
        ];

        foreach ($types as $type) {
            NotificationType::firstOrCreate(
                ['key' => $type['key']],
                $type
            );
        }
    }
}
