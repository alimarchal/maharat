<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
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

            // Additional seeders if needed
            AccountCodeSeeder::class,
            ChartOfAccountSeeder::class,
            AccountSeeder::class,
            FinancialTransactionSeeder::class,

            PaymentOrderSeeder::class,
            PaymentOrderApprovalTransactionSeeder::class,
            
            MahratInvoiceApprovalTransactionSeeder::class,
        ]);
    }
}
