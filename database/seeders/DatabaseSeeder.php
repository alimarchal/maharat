<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Check if users table exists
        if (!Schema::hasTable('users')) {
            $this->command->error('Users table does not exist. Please run migrations first.');
            return;
        }

        $this->call([
            // Base data seeders
            StatusSeeder::class,
            DesignationSeeder::class,
            CurrencySeeder::class,
            CountrySeeder::class,
            UnitSeeder::class,

            // User and organization structure
            DocumentPermissionSeeder::class,
            RoleAndPermissionSeeder::class,
            CompanySeeder::class,
            DepartmentSeeder::class,
            NotificationTypesSeeder::class,
            NotificationChannelsSeeder::class,
            UserSeeder::class,

            // Product related seeders
            ProductCategorySeeder::class,
            ProductSeeder::class,
            BrandSeeder::class,

            // Warehouse and inventory
            WarehouseSeeder::class,
            InventorySeeder::class,
            WarehouseManagerSeeder::class,

            // Fiscal and budget management
            FiscalPeriodSeeder::class,
            CostCenterSeeder::class,
            BudgetSeeder::class,

            // Supply chain seeders
            SupplierSeeder::class,
            RfqSeeder::class,
            RfqCategorySeeder::class,
            RfqItemSeeder::class,
            QuotationSeeder::class,
            ProcessSeeder::class,
            ProcessStepSeeder::class,

            // Purchase and reception seeders
            PurchaseOrderSeeder::class,
            GrnSeeder::class,
            GrnReceiveGoodSeeder::class,

            // Material management seeders
            MaterialRequestSeeder::class,
            MaterialRequestItemSeeder::class,

            // Invoice management seeders
            CustomerSeeder::class,
            InvoiceSeeder::class,
            InvoiceItemSeeder::class,
            ExternalInvoiceSeeder::class,

            // Financial management seeders
            AccountCodeSeeder::class,
            ChartOfAccountSeeder::class,
            AccountSeeder::class,
            FinancialTransactionSeeder::class,
            CashFlowTransactionSeeder::class,

            // Asset and Equity seeders
            AssetSeeder::class,
            AssetTransactionSeeder::class,
            EquityAccountSeeder::class,
            EquityTransactionSeeder::class,

            // Payment and approval seeders
            PaymentOrderSeeder::class,
            PaymentOrderApprovalTransactionSeeder::class,
            MahratInvoiceApprovalTransactionSeeder::class,
            FaqSeeder::class,

            AccountsSeeder::class,
        ]);

        $this->call(CardSeeder::class);

        // Only run the designation permissions seeder if we have users
        if (DB::table('users')->count() > 0) {
            $this->call(AssignDesignationPermissionsSeeder::class);
        } else {
            $this->command->warn('No users found. Skipping designation permissions assignment.');
        }
    }
}
