<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Card;
use Illuminate\Support\Facades\DB;

class CardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, clear existing cards
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Card::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        // Create main section cards
        $mainCards = $this->getMainSectionCards();
        $mainCardIds = [];
        
        foreach ($mainCards as $card) {
            $newCard = Card::create([
                'name' => $card['name'],
                'description' => $card['description'],
                'section_id' => $card['section_id'],
                'order' => $card['order'],
                'is_active' => true
            ]);
            
            $mainCardIds[$card['section_id']] = $newCard->id;
        }
        
        // Create subsection cards
        $subCards = $this->getSubSectionCards();
        
        foreach ($subCards as $card) {
            // Set parent_id based on the section_id
            $parentId = $mainCardIds[$card['section_id']] ?? null;
            
            Card::create([
                'name' => $card['name'],
                'description' => $card['description'],
                'section_id' => $card['section_id'],
                'subsection_id' => $card['subsection_id'],
                'parent_id' => $parentId,
                'order' => $card['order'],
                'is_active' => true
            ]);
        }
    }

    /**
     * Get cards for main sections
     */
    private function getMainSectionCards(): array
    {
        // These are the cards from the UserManual.jsx file
        return [
            [
                'name' => 'Login Details Card',
                'description' => 'How to Login Company Details?',
                'section_id' => 'login-details',
                'order' => 0
            ],
            [
                'name' => 'Notification Settings Card',
                'description' => 'How to manage notifications?',
                'section_id' => 'notification-settings',
                'order' => 1
            ],
            [
                'name' => 'User Profile Settings Card',
                'description' => 'How to edit user profile in settings?',
                'section_id' => 'user-profile',
                'order' => 2
            ],
            [
                'name' => 'Maharat Info Settings Card',
                'description' => 'How to set Company profile?',
                'section_id' => 'company-info',
                'order' => 3
            ],
            [
                'name' => 'Request Card',
                'description' => 'How to create Request for Material?',
                'section_id' => 'request',
                'order' => 4
            ],
            [
                'name' => 'Task Center Card',
                'description' => 'How to check my task?',
                'section_id' => 'task-center',
                'order' => 5
            ],
            [
                'name' => 'Procurement Center Card',
                'description' => 'How to generate RFQ\'s for Quotation?',
                'section_id' => 'procurement',
                'order' => 6
            ],
            [
                'name' => 'Finance Center Card',
                'description' => 'How to manage Finance?',
                'section_id' => 'finance',
                'order' => 7
            ],
            [
                'name' => 'Warehouse Card',
                'description' => 'How to create & manage warehouse?',
                'section_id' => 'warehouse',
                'order' => 8
            ],
            [
                'name' => 'Budget & Accounts Card',
                'description' => 'How to create and add budget?',
                'section_id' => 'budget',
                'order' => 9
            ],
            [
                'name' => 'Reports & Statuses Card',
                'description' => 'How to manage reports?',
                'section_id' => 'reports',
                'order' => 10
            ],
            [
                'name' => 'Configuration Center Card',
                'description' => 'How to manage configuration center?',
                'section_id' => 'configuration',
                'order' => 11
            ],
        ];
    }

    /**
     * Get cards from subsections
     */
    private function getSubSectionCards(): array
    {
        // These are the cards from the ManualSubSection.jsx file
        return [
            // Procurement subsections
            [
                'name' => 'RFQs Card',
                'description' => 'How to add and create RFQ\'s?',
                'section_id' => 'procurement',
                'subsection_id' => 'rfqs',
                'order' => 0
            ],
            [
                'name' => 'Quotations Card',
                'description' => 'How to create and add quotations?',
                'section_id' => 'procurement',
                'subsection_id' => 'quotations',
                'order' => 1
            ],
            [
                'name' => 'Purchase Orders Card',
                'description' => 'How to view and create purchase order?',
                'section_id' => 'procurement',
                'subsection_id' => 'purchase-order',
                'order' => 2
            ],
            [
                'name' => 'External Invoices Card',
                'description' => 'How to create external invoices?',
                'section_id' => 'procurement',
                'subsection_id' => 'external-invoices',
                'order' => 3
            ],
            
            // Finance subsections
            [
                'name' => 'Maharat Invoices Card',
                'description' => 'How to create Maharat Invoices?',
                'section_id' => 'finance',
                'subsection_id' => 'maharat-invoices',
                'order' => 0
            ],
            [
                'name' => 'Accounts Card',
                'description' => 'How to manage Accounts?',
                'section_id' => 'finance',
                'subsection_id' => 'accounts',
                'order' => 1
            ],
            [
                'name' => 'Payment Order Card',
                'description' => 'How to create Payment Orders?',
                'section_id' => 'finance',
                'subsection_id' => 'payment-order',
                'order' => 2
            ],
            [
                'name' => 'Account Receivables Card',
                'description' => 'How to manage account receivables?',
                'section_id' => 'finance',
                'subsection_id' => 'account-receivables',
                'order' => 3
            ],
            
            // Warehouse subsections
            [
                'name' => 'Create Warehouse Card',
                'description' => 'How to create a new warehouse?',
                'section_id' => 'warehouse',
                'subsection_id' => 'create-warehouse',
                'order' => 0
            ],
            [
                'name' => 'Issue Material Card',
                'description' => 'How we issue a Material to User?',
                'section_id' => 'warehouse',
                'subsection_id' => 'issue-material',
                'order' => 1
            ],
            [
                'name' => 'GRNs Card',
                'description' => 'How to create Goods receiving notes?',
                'section_id' => 'warehouse',
                'subsection_id' => 'grns',
                'order' => 2
            ],
            [
                'name' => 'Inventory Tracking Card',
                'description' => 'How to manage inventory in warehouses?',
                'section_id' => 'warehouse',
                'subsection_id' => 'inventory',
                'order' => 3
            ],
            
            // Budget subsections
            [
                'name' => 'Cost Center Card',
                'description' => 'How to create a new Cost Center',
                'section_id' => 'budget',
                'subsection_id' => 'cost-centers',
                'order' => 0
            ],
            [
                'name' => 'Budget Card',
                'description' => 'How to Create a Budget?',
                'section_id' => 'budget',
                'subsection_id' => 'budget',
                'order' => 1
            ],
            [
                'name' => 'Request Budget Card',
                'description' => 'How to Create Request a Budget?',
                'section_id' => 'budget',
                'subsection_id' => 'request-budget',
                'order' => 2
            ],
            
            // Configuration subsections
            [
                'name' => 'Organizational Chart Card',
                'description' => 'How to manage Organizational Chart?',
                'section_id' => 'configuration',
                'subsection_id' => 'chart',
                'order' => 0
            ],
            [
                'name' => 'Process Flow Card',
                'description' => 'How to manage Process flow?',
                'section_id' => 'configuration',
                'subsection_id' => 'process-flow',
                'order' => 1
            ],
        ];
    }
}
