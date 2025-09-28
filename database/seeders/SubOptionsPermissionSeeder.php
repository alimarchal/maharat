<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class SubOptionsPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Quotations sub-options
            'add_supplier',
            'add_new_quotation',
            
            // Maharat Invoice sub-options
            'add_customers',
            'create_new_invoice',
            
            // Accounts sub-options
            'create_new_account',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $this->command->info('Sub-options permissions created successfully!');
    }
}
