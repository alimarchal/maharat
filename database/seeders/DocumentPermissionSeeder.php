<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class DocumentPermissionSeeder extends Seeder
{
    public function run()
    {
        $documentTypes = [
            'rfqs',
            'quotations',
            'goods_receiving_notes',
            'material_requests',
            'invoices',
            'payment_orders'
        ];

        $actions = [
            'view',
            'create',
            'edit',
            'delete'
        ];

        foreach ($documentTypes as $doc) {
            foreach ($actions as $action) {
                Permission::firstOrCreate([
                    'name' => "${action}_${doc}",
                    'guard_name' => 'web'
                ]);
            }
        }
    }
} 