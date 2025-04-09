<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Faq;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'title' => 'Budget Request Process',
                'question' => 'How do I create a new budget request?',
                'description' => 'To create a new budget request, navigate to the Budget section and click on "Create New Request". Fill in the required details including the amount, purpose, and supporting documents. The request will then go through an approval process based on your organization\'s workflow.',
            ],
            [
                'title' => 'Asset Management',
                'question' => 'How do I add a new asset to the system?',
                'description' => 'To add a new asset, go to the Assets section and click "Add New Asset". Fill in the asset details including name, type (current, fixed, or intangible), current value, and acquisition date. You can also upload supporting documents if needed.',
            ],
            [
                'title' => 'Balance Sheet',
                'question' => 'How are assets categorized in the balance sheet?',
                'description' => 'Assets are categorized into current assets (without donor restrictions) and fixed/tangible assets (with donor restrictions). Current assets include cash and cash equivalents, while fixed assets include property, equipment, and other long-term assets.',
            ],
            [
                'title' => 'Financial Transactions',
                'question' => 'How do I record a financial transaction?',
                'description' => 'Navigate to the Financial Transactions section and click "Add New Transaction". Select the transaction type, enter the amount, choose the appropriate chart of accounts, and provide any necessary documentation. The transaction will be recorded and reflected in your financial statements.',
            ],
            [
                'title' => 'User Roles and Permissions',
                'question' => 'How do user roles affect system access?',
                'description' => 'User roles determine what actions you can perform in the system. For example, administrators have full access to all features, while regular users may only have access to specific modules based on their role. Your access level is set by your organization\'s administrator.',
            ],
            [
                'title' => 'Inventory Management',
                'question' => 'How do I track inventory items?',
                'description' => 'The system allows you to track inventory through the Inventory Management module. You can add new items, update quantities, view stock levels, and generate inventory reports. Each item can be categorized and assigned to specific warehouses or locations.',
            ],
            [
                'title' => 'Purchase Orders',
                'question' => 'What is the process for creating a purchase order?',
                'description' => 'To create a purchase order, first create a budget request and get it approved. Then, navigate to the Purchase Orders section, select the approved budget, add the required items and quantities, and submit for approval. The PO will follow your organization\'s approval workflow.',
            ],
            [
                'title' => 'Reports and Analytics',
                'question' => 'What types of reports can I generate?',
                'description' => 'The system provides various reports including balance sheets, income statements, budget utilization reports, inventory reports, and asset depreciation reports. You can customize these reports by selecting specific date ranges and categories.',
            ],
            [
                'title' => 'Notifications',
                'question' => 'How do I manage my notifications?',
                'description' => 'You can manage your notifications through the Notification Settings. Here you can choose which types of notifications you want to receive, set your preferred notification channels (email, in-app, etc.), and configure notification frequency.',
            ],
            [
                'title' => 'Data Security',
                'question' => 'How is my data secured in the system?',
                'description' => 'The system implements multiple security measures including role-based access control, data encryption, and regular backups. Your data is protected through secure authentication and authorization processes. Regular security audits are conducted to ensure data safety.',
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::create($faq);
        }
    }
}
