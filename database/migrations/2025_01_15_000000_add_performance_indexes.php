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
        // Only add indexes if they don't already exist
        $this->addIndexIfNotExists('users', ['is_active', 'created_at'], 'users_is_active_created_at_index');
        $this->addIndexIfNotExists('users', ['department_id', 'is_active'], 'users_department_id_is_active_index');
        $this->addIndexIfNotExists('users', ['company_id', 'is_active'], 'users_company_id_is_active_index');
        $this->addIndexIfNotExists('users', ['branch_id', 'is_active'], 'users_branch_id_is_active_index');
        $this->addIndexIfNotExists('users', ['designation_id', 'is_active'], 'users_designation_id_is_active_index');
        $this->addIndexIfNotExists('users', ['last_login_at'], 'users_last_login_at_index');
        $this->addIndexIfNotExists('users', ['email_verified_at'], 'users_email_verified_at_index');

        // Material requests indexes
        if (Schema::hasTable('material_requests')) {
            $this->addIndexIfNotExists('material_requests', ['requester_id', 'created_at'], 'material_requests_requester_id_created_at_index');
            $this->addIndexIfNotExists('material_requests', ['warehouse_id', 'status_id'], 'material_requests_warehouse_id_status_id_index');
            $this->addIndexIfNotExists('material_requests', ['department_id', 'status_id'], 'material_requests_department_id_status_id_index');
            $this->addIndexIfNotExists('material_requests', ['status_id', 'created_at'], 'material_requests_status_id_created_at_index');
            $this->addIndexIfNotExists('material_requests', ['expected_delivery_date'], 'material_requests_expected_delivery_date_index');
        }

        // Material request items indexes
        if (Schema::hasTable('material_request_items')) {
            $this->addIndexIfNotExists('material_request_items', ['material_request_id', 'product_id'], 'material_request_items_material_request_id_product_id_index');
            $this->addIndexIfNotExists('material_request_items', ['product_id', 'category_id'], 'material_request_items_product_id_category_id_index');
            $this->addIndexIfNotExists('material_request_items', ['urgency', 'created_at'], 'material_request_items_urgency_created_at_index');
        }

        // Purchase orders indexes
        if (Schema::hasTable('purchase_orders')) {
            $this->addIndexIfNotExists('purchase_orders', ['user_id', 'status'], 'purchase_orders_user_id_status_index');
            $this->addIndexIfNotExists('purchase_orders', ['supplier_id', 'status'], 'purchase_orders_supplier_id_status_index');
            $this->addIndexIfNotExists('purchase_orders', ['department_id', 'status'], 'purchase_orders_department_id_status_index');
            $this->addIndexIfNotExists('purchase_orders', ['cost_center_id', 'status'], 'purchase_orders_cost_center_id_status_index');
            $this->addIndexIfNotExists('purchase_orders', ['status', 'created_at'], 'purchase_orders_status_created_at_index');
            $this->addIndexIfNotExists('purchase_orders', ['purchase_order_date', 'status'], 'purchase_orders_purchase_order_date_status_index');
            $this->addIndexIfNotExists('purchase_orders', ['expiry_date', 'status'], 'purchase_orders_expiry_date_status_index');
        }

        // Payment orders indexes
        if (Schema::hasTable('payment_orders')) {
            $this->addIndexIfNotExists('payment_orders', ['user_id', 'status'], 'payment_orders_user_id_status_index');
            $this->addIndexIfNotExists('payment_orders', ['purchase_order_id', 'status'], 'payment_orders_purchase_order_id_status_index');
            $this->addIndexIfNotExists('payment_orders', ['cost_center_id', 'status'], 'payment_orders_cost_center_id_status_index');
            $this->addIndexIfNotExists('payment_orders', ['status', 'created_at'], 'payment_orders_status_created_at_index');
            $this->addIndexIfNotExists('payment_orders', ['due_date', 'status'], 'payment_orders_due_date_status_index');
            $this->addIndexIfNotExists('payment_orders', ['issue_date', 'status'], 'payment_orders_issue_date_status_index');
        }

        // RFQs indexes
        if (Schema::hasTable('rfqs')) {
            $this->addIndexIfNotExists('rfqs', ['requester_id', 'created_at'], 'rfqs_requester_id_created_at_index');
            $this->addIndexIfNotExists('rfqs', ['status_id', 'created_at'], 'rfqs_status_id_created_at_index');
            $this->addIndexIfNotExists('rfqs', ['department_id', 'status_id'], 'rfqs_department_id_status_id_index');
        }

        // Quotations indexes
        if (Schema::hasTable('quotations')) {
            $this->addIndexIfNotExists('quotations', ['supplier_id', 'created_at'], 'quotations_supplier_id_created_at_index');
            $this->addIndexIfNotExists('quotations', ['rfq_id', 'created_at'], 'quotations_rfq_id_created_at_index');
            $this->addIndexIfNotExists('quotations', ['status_id', 'created_at'], 'quotations_status_id_created_at_index');
        }

        // Invoices indexes
        if (Schema::hasTable('invoices')) {
            $this->addIndexIfNotExists('invoices', ['client_id', 'status'], 'invoices_client_id_status_index');
            $this->addIndexIfNotExists('invoices', ['status', 'created_at'], 'invoices_status_created_at_index');
            $this->addIndexIfNotExists('invoices', ['due_date', 'status'], 'invoices_due_date_status_index');
            $this->addIndexIfNotExists('invoices', ['issue_date', 'status'], 'invoices_issue_date_status_index');
        }

        // External invoices indexes
        if (Schema::hasTable('external_invoices')) {
            $this->addIndexIfNotExists('external_invoices', ['supplier_id', 'status'], 'external_invoices_supplier_id_status_index');
            $this->addIndexIfNotExists('external_invoices', ['status', 'created_at'], 'external_invoices_status_created_at_index');
            $this->addIndexIfNotExists('external_invoices', ['payable_date', 'status'], 'external_invoices_payable_date_status_index');
        }

        // Budgets indexes
        if (Schema::hasTable('budgets')) {
            $this->addIndexIfNotExists('budgets', ['department_id', 'status'], 'budgets_department_id_status_index');
            $this->addIndexIfNotExists('budgets', ['fiscal_period_id', 'status'], 'budgets_fiscal_period_id_status_index');
            $this->addIndexIfNotExists('budgets', ['status', 'created_at'], 'budgets_status_created_at_index');
        }

        // Request budgets indexes
        if (Schema::hasTable('request_budgets')) {
            $this->addIndexIfNotExists('request_budgets', ['user_id', 'status'], 'request_budgets_user_id_status_index');
            $this->addIndexIfNotExists('request_budgets', ['department_id', 'status'], 'request_budgets_department_id_status_index');
            $this->addIndexIfNotExists('request_budgets', ['status', 'created_at'], 'request_budgets_status_created_at_index');
        }

        // Tasks indexes
        if (Schema::hasTable('tasks')) {
            $this->addIndexIfNotExists('tasks', ['assigned_to', 'status'], 'tasks_assigned_to_status_index');
            $this->addIndexIfNotExists('tasks', ['created_by', 'status'], 'tasks_created_by_status_index');
            $this->addIndexIfNotExists('tasks', ['status', 'created_at'], 'tasks_status_created_at_index');
            $this->addIndexIfNotExists('tasks', ['due_date', 'status'], 'tasks_due_date_status_index');
        }

        // Notifications indexes
        if (Schema::hasTable('notifications')) {
            $this->addIndexIfNotExists('notifications', ['notifiable_id', 'notifiable_type', 'read_at'], 'notifications_notifiable_id_notifiable_type_read_at_index');
            $this->addIndexIfNotExists('notifications', ['notifiable_id', 'notifiable_type', 'created_at'], 'notifications_notifiable_id_notifiable_type_created_at_index');
            $this->addIndexIfNotExists('notifications', ['read_at', 'created_at'], 'notifications_read_at_created_at_index');
        }

        // Activity log indexes
        if (Schema::hasTable('activity_log')) {
            $this->addIndexIfNotExists('activity_log', ['subject_id', 'subject_type', 'created_at'], 'activity_log_subject_id_subject_type_created_at_index');
            $this->addIndexIfNotExists('activity_log', ['causer_id', 'causer_type', 'created_at'], 'activity_log_causer_id_causer_type_created_at_index');
            $this->addIndexIfNotExists('activity_log', ['event', 'created_at'], 'activity_log_event_created_at_index');
            $this->addIndexIfNotExists('activity_log', ['log_name', 'created_at'], 'activity_log_log_name_created_at_index');
        }

        // Financial transactions indexes
        if (Schema::hasTable('financial_transactions')) {
            $this->addIndexIfNotExists('financial_transactions', ['account_id', 'created_at'], 'financial_transactions_account_id_created_at_index');
            $this->addIndexIfNotExists('financial_transactions', ['transaction_type', 'created_at'], 'financial_transactions_transaction_type_created_at_index');
            $this->addIndexIfNotExists('financial_transactions', ['amount', 'created_at'], 'financial_transactions_amount_created_at_index');
        }

        // Inventory indexes
        if (Schema::hasTable('inventories')) {
            $this->addIndexIfNotExists('inventories', ['product_id', 'warehouse_id'], 'inventories_product_id_warehouse_id_index');
            $this->addIndexIfNotExists('inventories', ['warehouse_id', 'created_at'], 'inventories_warehouse_id_created_at_index');
            $this->addIndexIfNotExists('inventories', ['product_id', 'created_at'], 'inventories_product_id_created_at_index');
        }

        // Inventory adjustments indexes
        if (Schema::hasTable('inventory_adjustments')) {
            $this->addIndexIfNotExists('inventory_adjustments', ['product_id', 'warehouse_id', 'created_at'], 'inventory_adjustments_product_id_warehouse_id_created_at_index');
            $this->addIndexIfNotExists('inventory_adjustments', ['adjustment_type', 'created_at'], 'inventory_adjustments_adjustment_type_created_at_index');
        }

        // Inventory transfers indexes
        if (Schema::hasTable('inventory_transfers')) {
            $this->addIndexIfNotExists('inventory_transfers', ['from_warehouse_id', 'to_warehouse_id', 'created_at'], 'inventory_transfers_from_warehouse_id_to_warehouse_id_created_at_index');
            $this->addIndexIfNotExists('inventory_transfers', ['product_id', 'created_at'], 'inventory_transfers_product_id_created_at_index');
            $this->addIndexIfNotExists('inventory_transfers', ['status', 'created_at'], 'inventory_transfers_status_created_at_index');
        }

        // Assets indexes
        if (Schema::hasTable('assets')) {
            $this->addIndexIfNotExists('assets', ['asset_type', 'status'], 'assets_asset_type_status_index');
            $this->addIndexIfNotExists('assets', ['department_id', 'status'], 'assets_department_id_status_index');
            $this->addIndexIfNotExists('assets', ['status', 'created_at'], 'assets_status_created_at_index');
        }

        // Asset transactions indexes
        if (Schema::hasTable('asset_transactions')) {
            $this->addIndexIfNotExists('asset_transactions', ['asset_id', 'transaction_type', 'created_at'], 'asset_transactions_asset_id_transaction_type_created_at_index');
            $this->addIndexIfNotExists('asset_transactions', ['transaction_type', 'created_at'], 'asset_transactions_transaction_type_created_at_index');
        }

        // Email logs indexes
        if (Schema::hasTable('email_logs')) {
            $this->addIndexIfNotExists('email_logs', ['recipient_email', 'status', 'created_at'], 'email_logs_recipient_email_status_created_at_index');
            $this->addIndexIfNotExists('email_logs', ['status', 'created_at'], 'email_logs_status_created_at_index');
            $this->addIndexIfNotExists('email_logs', ['email_type', 'created_at'], 'email_logs_email_type_created_at_index');
        }

        // Item requests indexes
        if (Schema::hasTable('item_requests')) {
            $this->addIndexIfNotExists('item_requests', ['user_id', 'status'], 'item_requests_user_id_status_index');
            $this->addIndexIfNotExists('item_requests', ['product_id', 'status'], 'item_requests_product_id_status_index');
            $this->addIndexIfNotExists('item_requests', ['status', 'created_at'], 'item_requests_status_created_at_index');
        }

        // Suppliers indexes
        if (Schema::hasTable('suppliers')) {
            $this->addIndexIfNotExists('suppliers', ['status', 'created_at'], 'suppliers_status_created_at_index');
            $this->addIndexIfNotExists('suppliers', ['company_name', 'status'], 'suppliers_company_name_status_index');
        }

        // Products indexes
        if (Schema::hasTable('products')) {
            $this->addIndexIfNotExists('products', ['category_id', 'status'], 'products_category_id_status_index');
            $this->addIndexIfNotExists('products', ['status', 'created_at'], 'products_status_created_at_index');
            $this->addIndexIfNotExists('products', ['brand', 'status'], 'products_brand_status_index');
        }

        // Warehouses indexes
        if (Schema::hasTable('warehouses')) {
            $this->addIndexIfNotExists('warehouses', ['status', 'created_at'], 'warehouses_status_created_at_index');
            $this->addIndexIfNotExists('warehouses', ['location', 'status'], 'warehouses_location_status_index');
        }

        // Departments indexes
        if (Schema::hasTable('departments')) {
            $this->addIndexIfNotExists('departments', ['company_id', 'status'], 'departments_company_id_status_index');
            $this->addIndexIfNotExists('departments', ['status', 'created_at'], 'departments_status_created_at_index');
        }

        // Branches indexes
        if (Schema::hasTable('branches')) {
            $this->addIndexIfNotExists('branches', ['company_id', 'status'], 'branches_company_id_status_index');
            $this->addIndexIfNotExists('branches', ['status', 'created_at'], 'branches_status_created_at_index');
        }

        // Cost centers indexes
        if (Schema::hasTable('cost_centers')) {
            $this->addIndexIfNotExists('cost_centers', ['parent_id', 'status'], 'cost_centers_parent_id_status_index');
            $this->addIndexIfNotExists('cost_centers', ['status', 'created_at'], 'cost_centers_status_created_at_index');
        }

        // Fiscal periods indexes
        if (Schema::hasTable('fiscal_periods')) {
            $this->addIndexIfNotExists('fiscal_periods', ['fiscal_year_id', 'status'], 'fiscal_periods_fiscal_year_id_status_index');
            $this->addIndexIfNotExists('fiscal_periods', ['status', 'created_at'], 'fiscal_periods_status_created_at_index');
            $this->addIndexIfNotExists('fiscal_periods', ['start_date', 'end_date'], 'fiscal_periods_start_date_end_date_index');
        }

        // Fiscal years indexes
        if (Schema::hasTable('fiscal_years')) {
            $this->addIndexIfNotExists('fiscal_years', ['status', 'created_at'], 'fiscal_years_status_created_at_index');
            $this->addIndexIfNotExists('fiscal_years', ['start_date', 'end_date'], 'fiscal_years_start_date_end_date_index');
        }

        // Chart of accounts indexes
        if (Schema::hasTable('chart_of_accounts')) {
            $this->addIndexIfNotExists('chart_of_accounts', ['parent_id', 'status'], 'chart_of_accounts_parent_id_status_index');
            $this->addIndexIfNotExists('chart_of_accounts', ['account_type', 'status'], 'chart_of_accounts_account_type_status_index');
            $this->addIndexIfNotExists('chart_of_accounts', ['status', 'created_at'], 'chart_of_accounts_status_created_at_index');
        }

        // Accounts indexes
        if (Schema::hasTable('accounts')) {
            $this->addIndexIfNotExists('accounts', ['chart_of_account_id', 'status'], 'accounts_chart_of_account_id_status_index');
            $this->addIndexIfNotExists('accounts', ['account_code_id', 'status'], 'accounts_account_code_id_status_index');
            $this->addIndexIfNotExists('accounts', ['status', 'created_at'], 'accounts_status_created_at_index');
        }

        // Customers indexes
        if (Schema::hasTable('customers')) {
            $this->addIndexIfNotExists('customers', ['status', 'created_at'], 'customers_status_created_at_index');
            $this->addIndexIfNotExists('customers', ['company_name', 'status'], 'customers_company_name_status_index');
        }

        // GRNs indexes
        if (Schema::hasTable('grns')) {
            $this->addIndexIfNotExists('grns', ['purchase_order_id', 'status'], 'grns_purchase_order_id_status_index');
            $this->addIndexIfNotExists('grns', ['warehouse_id', 'status'], 'grns_warehouse_id_status_index');
            $this->addIndexIfNotExists('grns', ['status', 'created_at'], 'grns_status_created_at_index');
        }

        // GRN receive goods indexes
        if (Schema::hasTable('grn_receive_goods')) {
            $this->addIndexIfNotExists('grn_receive_goods', ['grn_id', 'product_id'], 'grn_receive_goods_grn_id_product_id_index');
            $this->addIndexIfNotExists('grn_receive_goods', ['product_id', 'created_at'], 'grn_receive_goods_product_id_created_at_index');
        }

        // Issue materials indexes
        if (Schema::hasTable('issue_materials')) {
            $this->addIndexIfNotExists('issue_materials', ['requester_id', 'status'], 'issue_materials_requester_id_status_index');
            $this->addIndexIfNotExists('issue_materials', ['warehouse_id', 'status'], 'issue_materials_warehouse_id_status_index');
            $this->addIndexIfNotExists('issue_materials', ['status', 'created_at'], 'issue_materials_status_created_at_index');
        }

        // Cash flow transactions indexes
        if (Schema::hasTable('cash_flow_transactions')) {
            $this->addIndexIfNotExists('cash_flow_transactions', ['account_id', 'created_at'], 'cash_flow_transactions_account_id_created_at_index');
            $this->addIndexIfNotExists('cash_flow_transactions', ['transaction_type', 'created_at'], 'cash_flow_transactions_transaction_type_created_at_index');
            $this->addIndexIfNotExists('cash_flow_transactions', ['amount', 'created_at'], 'cash_flow_transactions_amount_created_at_index');
        }

        // Equity accounts indexes
        if (Schema::hasTable('equity_accounts')) {
            $this->addIndexIfNotExists('equity_accounts', ['status', 'created_at'], 'equity_accounts_status_created_at_index');
            $this->addIndexIfNotExists('equity_accounts', ['account_type', 'status'], 'equity_accounts_account_type_status_index');
        }

        // Equity transactions indexes
        if (Schema::hasTable('equity_transactions')) {
            $this->addIndexIfNotExists('equity_transactions', ['equity_account_id', 'created_at'], 'equity_transactions_equity_account_id_created_at_index');
            $this->addIndexIfNotExists('equity_transactions', ['transaction_type', 'created_at'], 'equity_transactions_transaction_type_created_at_index');
        }

        // Transactions flow indexes
        if (Schema::hasTable('transactions_flow')) {
            $this->addIndexIfNotExists('transactions_flow', ['transaction_id', 'transaction_type', 'created_at'], 'transactions_flow_transaction_id_transaction_type_created_at_index');
            $this->addIndexIfNotExists('transactions_flow', ['status', 'created_at'], 'transactions_flow_status_created_at_index');
            $this->addIndexIfNotExists('transactions_flow', ['approver_id', 'status'], 'transactions_flow_approver_id_status_index');
        }

        // User permission overrides indexes
        if (Schema::hasTable('user_permission_overrides')) {
            $this->addIndexIfNotExists('user_permission_overrides', ['user_id', 'permission_id'], 'user_permission_overrides_user_id_permission_id_index');
            $this->addIndexIfNotExists('user_permission_overrides', ['user_id', 'created_at'], 'user_permission_overrides_user_id_created_at_index');
        }

        // User manuals indexes
        if (Schema::hasTable('user_manuals')) {
            $this->addIndexIfNotExists('user_manuals', ['status', 'created_at'], 'user_manuals_status_created_at_index');
            $this->addIndexIfNotExists('user_manuals', ['module', 'status'], 'user_manuals_module_status_index');
        }

        // Manual steps indexes
        if (Schema::hasTable('manual_steps')) {
            $this->addIndexIfNotExists('manual_steps', ['user_manual_id', 'step_order'], 'manual_steps_user_manual_id_step_order_index');
            $this->addIndexIfNotExists('manual_steps', ['user_manual_id', 'created_at'], 'manual_steps_user_manual_id_created_at_index');
        }

        // Step details indexes
        if (Schema::hasTable('step_details')) {
            $this->addIndexIfNotExists('step_details', ['manual_step_id', 'created_at'], 'step_details_manual_step_id_created_at_index');
        }

        // Step screenshots indexes
        if (Schema::hasTable('step_screenshots')) {
            $this->addIndexIfNotExists('step_screenshots', ['manual_step_id', 'created_at'], 'step_screenshots_manual_step_id_created_at_index');
        }

        // Step actions indexes
        if (Schema::hasTable('step_actions')) {
            $this->addIndexIfNotExists('step_actions', ['manual_step_id', 'created_at'], 'step_actions_manual_step_id_created_at_index');
        }

        // Cards indexes
        if (Schema::hasTable('cards')) {
            $this->addIndexIfNotExists('cards', ['status', 'created_at'], 'cards_status_created_at_index');
            $this->addIndexIfNotExists('cards', ['card_type', 'status'], 'cards_card_type_status_index');
        }

        // FAQs indexes
        if (Schema::hasTable('faqs')) {
            $this->addIndexIfNotExists('faqs', ['status', 'created_at'], 'faqs_status_created_at_index');
            $this->addIndexIfNotExists('faqs', ['category', 'status'], 'faqs_category_status_index');
        }

        // FAQ approvals indexes
        if (Schema::hasTable('faq_approvals')) {
            $this->addIndexIfNotExists('faq_approvals', ['faq_id', 'status'], 'faq_approvals_faq_id_status_index');
            $this->addIndexIfNotExists('faq_approvals', ['approver_id', 'status'], 'faq_approvals_approver_id_status_index');
            $this->addIndexIfNotExists('faq_approvals', ['status', 'created_at'], 'faq_approvals_status_created_at_index');
        }

        // Budget usages indexes
        if (Schema::hasTable('budget_usages')) {
            $this->addIndexIfNotExists('budget_usages', ['budget_id', 'created_at'], 'budget_usages_budget_id_created_at_index');
            $this->addIndexIfNotExists('budget_usages', ['department_id', 'created_at'], 'budget_usages_department_id_created_at_index');
            $this->addIndexIfNotExists('budget_usages', ['usage_type', 'created_at'], 'budget_usages_usage_type_created_at_index');
        }

        // External delivery notes indexes
        if (Schema::hasTable('external_delivery_notes')) {
            $this->addIndexIfNotExists('external_delivery_notes', ['supplier_id', 'status'], 'external_delivery_notes_supplier_id_status_index');
            $this->addIndexIfNotExists('external_delivery_notes', ['status', 'created_at'], 'external_delivery_notes_status_created_at_index');
            $this->addIndexIfNotExists('external_delivery_notes', ['delivery_date', 'status'], 'external_delivery_notes_delivery_date_status_index');
        }

        // Invoice documents indexes
        if (Schema::hasTable('invoice_documents')) {
            $this->addIndexIfNotExists('invoice_documents', ['invoice_id', 'created_at'], 'invoice_documents_invoice_id_created_at_index');
            $this->addIndexIfNotExists('invoice_documents', ['document_type', 'created_at'], 'invoice_documents_document_type_created_at_index');
        }

        // RFQ requests indexes
        if (Schema::hasTable('rfq_requests')) {
            $this->addIndexIfNotExists('rfq_requests', ['rfq_id', 'status'], 'rfq_requests_rfq_id_status_index');
            $this->addIndexIfNotExists('rfq_requests', ['supplier_id', 'status'], 'rfq_requests_supplier_id_status_index');
            $this->addIndexIfNotExists('rfq_requests', ['status', 'created_at'], 'rfq_requests_status_created_at_index');
        }

        // RFQ items indexes
        if (Schema::hasTable('rfq_items')) {
            $this->addIndexIfNotExists('rfq_items', ['rfq_id', 'product_id'], 'rfq_items_rfq_id_product_id_index');
            $this->addIndexIfNotExists('rfq_items', ['product_id', 'created_at'], 'rfq_items_product_id_created_at_index');
        }

        // RFQ categories indexes
        if (Schema::hasTable('rfq_categories')) {
            $this->addIndexIfNotExists('rfq_categories', ['rfq_id', 'created_at'], 'rfq_categories_rfq_id_created_at_index');
        }

        // Quotation documents indexes
        if (Schema::hasTable('quotation_documents')) {
            $this->addIndexIfNotExists('quotation_documents', ['quotation_id', 'created_at'], 'quotation_documents_quotation_id_created_at_index');
            $this->addIndexIfNotExists('quotation_documents', ['document_type', 'created_at'], 'quotation_documents_document_type_created_at_index');
        }

        // Supplier contacts indexes
        if (Schema::hasTable('supplier_contacts')) {
            $this->addIndexIfNotExists('supplier_contacts', ['supplier_id', 'created_at'], 'supplier_contacts_supplier_id_created_at_index');
            $this->addIndexIfNotExists('supplier_contacts', ['contact_type', 'created_at'], 'supplier_contacts_contact_type_created_at_index');
        }

        // Supplier addresses indexes
        if (Schema::hasTable('supplier_addresses')) {
            $this->addIndexIfNotExists('supplier_addresses', ['supplier_id', 'created_at'], 'supplier_addresses_supplier_id_created_at_index');
            $this->addIndexIfNotExists('supplier_addresses', ['address_type', 'created_at'], 'supplier_addresses_address_type_created_at_index');
        }

        // Warehouse managers indexes
        if (Schema::hasTable('warehouse_managers')) {
            $this->addIndexIfNotExists('warehouse_managers', ['warehouse_id', 'user_id'], 'warehouse_managers_warehouse_id_user_id_index');
            $this->addIndexIfNotExists('warehouse_managers', ['user_id', 'created_at'], 'warehouse_managers_user_id_created_at_index');
        }

        // Processes indexes
        if (Schema::hasTable('processes')) {
            $this->addIndexIfNotExists('processes', ['status', 'created_at'], 'processes_status_created_at_index');
            $this->addIndexIfNotExists('processes', ['process_type', 'status'], 'processes_process_type_status_index');
        }

        // Process steps indexes
        if (Schema::hasTable('process_steps')) {
            $this->addIndexIfNotExists('process_steps', ['process_id', 'step_order'], 'process_steps_process_id_step_order_index');
            $this->addIndexIfNotExists('process_steps', ['process_id', 'created_at'], 'process_steps_process_id_created_at_index');
        }

        // Material request transactions indexes
        if (Schema::hasTable('material_request_transactions')) {
            $this->addIndexIfNotExists('material_request_transactions', ['material_request_id', 'created_at'], 'material_request_transactions_material_request_id_created_at_index');
            $this->addIndexIfNotExists('material_request_transactions', ['status', 'created_at'], 'material_request_transactions_status_created_at_index');
        }

        // RFQ approval transactions indexes
        if (Schema::hasTable('rfq_approval_transactions')) {
            $this->addIndexIfNotExists('rfq_approval_transactions', ['rfq_id', 'status'], 'rfq_approval_transactions_rfq_id_status_index');
            $this->addIndexIfNotExists('rfq_approval_transactions', ['approver_id', 'status'], 'rfq_approval_transactions_approver_id_status_index');
            $this->addIndexIfNotExists('rfq_approval_transactions', ['status', 'created_at'], 'rfq_approval_transactions_status_created_at_index');
        }

        // PO approval transactions indexes
        if (Schema::hasTable('po_approval_transactions')) {
            $this->addIndexIfNotExists('po_approval_transactions', ['purchase_order_id', 'status'], 'po_approval_transactions_purchase_order_id_status_index');
            $this->addIndexIfNotExists('po_approval_transactions', ['approver_id', 'status'], 'po_approval_transactions_approver_id_status_index');
            $this->addIndexIfNotExists('po_approval_transactions', ['status', 'created_at'], 'po_approval_transactions_status_created_at_index');
        }

        // Budget approval transactions indexes
        if (Schema::hasTable('budget_approval_transactions')) {
            $this->addIndexIfNotExists('budget_approval_transactions', ['budget_id', 'status'], 'budget_approval_transactions_budget_id_status_index');
            $this->addIndexIfNotExists('budget_approval_transactions', ['approver_id', 'status'], 'budget_approval_transactions_approver_id_status_index');
            $this->addIndexIfNotExists('budget_approval_transactions', ['status', 'created_at'], 'budget_approval_transactions_status_created_at_index');
        }

        // Payment order approval transactions indexes
        if (Schema::hasTable('payment_order_approval_transactions')) {
            $this->addIndexIfNotExists('payment_order_approval_transactions', ['payment_order_id', 'status'], 'payment_order_approval_transactions_payment_order_id_status_index');
            $this->addIndexIfNotExists('payment_order_approval_transactions', ['approver_id', 'status'], 'payment_order_approval_transactions_approver_id_status_index');
            $this->addIndexIfNotExists('payment_order_approval_transactions', ['status', 'created_at'], 'payment_order_approval_transactions_status_created_at_index');
        }

        // Mahrat invoice approval transactions indexes
        if (Schema::hasTable('mahrat_invoice_approval_transactions')) {
            $this->addIndexIfNotExists('mahrat_invoice_approval_transactions', ['invoice_id', 'status'], 'mahrat_invoice_approval_transactions_invoice_id_status_index');
            $this->addIndexIfNotExists('mahrat_invoice_approval_transactions', ['approver_id', 'status'], 'mahrat_invoice_approval_transactions_approver_id_status_index');
            $this->addIndexIfNotExists('mahrat_invoice_approval_transactions', ['status', 'created_at'], 'mahrat_invoice_approval_transactions_status_created_at_index');
        }

        // Budget request approval transactions indexes
        if (Schema::hasTable('budget_request_approval_transactions')) {
            $this->addIndexIfNotExists('budget_request_approval_transactions', ['request_budget_id', 'status'], 'budget_request_approval_transactions_request_budget_id_status_index');
            $this->addIndexIfNotExists('budget_request_approval_transactions', ['approver_id', 'status'], 'budget_request_approval_transactions_approver_id_status_index');
            $this->addIndexIfNotExists('budget_request_approval_transactions', ['status', 'created_at'], 'budget_request_approval_transactions_status_created_at_index');
        }

        // Payment order logs indexes
        if (Schema::hasTable('payment_order_logs')) {
            $this->addIndexIfNotExists('payment_order_logs', ['payment_order_id', 'created_at'], 'payment_order_logs_payment_order_id_created_at_index');
            $this->addIndexIfNotExists('payment_order_logs', ['action', 'created_at'], 'payment_order_logs_action_created_at_index');
        }

        // Account codes indexes
        if (Schema::hasTable('account_codes')) {
            $this->addIndexIfNotExists('account_codes', ['status', 'created_at'], 'account_codes_status_created_at_index');
            $this->addIndexIfNotExists('account_codes', ['code', 'status'], 'account_codes_code_status_index');
        }

        // Statuses indexes
        if (Schema::hasTable('statuses')) {
            $this->addIndexIfNotExists('statuses', ['status_type', 'created_at'], 'statuses_status_type_created_at_index');
            $this->addIndexIfNotExists('statuses', ['status', 'status_type'], 'statuses_status_status_type_index');
        }

        // Countries indexes
        if (Schema::hasTable('countries')) {
            $this->addIndexIfNotExists('countries', ['status', 'created_at'], 'countries_status_created_at_index');
            $this->addIndexIfNotExists('countries', ['name', 'status'], 'countries_name_status_index');
        }

        // Companies indexes
        if (Schema::hasTable('companies')) {
            $this->addIndexIfNotExists('companies', ['status', 'created_at'], 'companies_status_created_at_index');
            $this->addIndexIfNotExists('companies', ['name', 'status'], 'companies_name_status_index');
        }

        // Currencies indexes
        if (Schema::hasTable('currencies')) {
            $this->addIndexIfNotExists('currencies', ['status', 'created_at'], 'currencies_status_created_at_index');
            $this->addIndexIfNotExists('currencies', ['code', 'status'], 'currencies_code_status_index');
        }

        // Designations indexes
        if (Schema::hasTable('designations')) {
            $this->addIndexIfNotExists('designations', ['status', 'created_at'], 'designations_status_created_at_index');
            $this->addIndexIfNotExists('designations', ['name', 'status'], 'designations_name_status_index');
        }

        // Jobs indexes
        if (Schema::hasTable('jobs')) {
            $this->addIndexIfNotExists('jobs', ['queue', 'reserved_at'], 'jobs_queue_reserved_at_index');
            $this->addIndexIfNotExists('jobs', ['queue', 'available_at'], 'jobs_queue_available_at_index');
            $this->addIndexIfNotExists('jobs', ['reserved_at'], 'jobs_reserved_at_index');
            $this->addIndexIfNotExists('jobs', ['available_at'], 'jobs_available_at_index');
        }

        // Job batches indexes
        if (Schema::hasTable('job_batches')) {
            $this->addIndexIfNotExists('job_batches', ['finished_at'], 'job_batches_finished_at_index');
            $this->addIndexIfNotExists('job_batches', ['created_at'], 'job_batches_created_at_index');
        }

        // Failed jobs indexes
        if (Schema::hasTable('failed_jobs')) {
            $this->addIndexIfNotExists('failed_jobs', ['failed_at'], 'failed_jobs_failed_at_index');
            $this->addIndexIfNotExists('failed_jobs', ['uuid'], 'failed_jobs_uuid_index');
        }

        // Cache indexes
        if (Schema::hasTable('cache')) {
            $this->addIndexIfNotExists('cache', ['expiration'], 'cache_expiration_index');
            $this->addIndexIfNotExists('cache', ['key'], 'cache_key_index');
        }

        // Cache locks indexes
        if (Schema::hasTable('cache_locks')) {
            $this->addIndexIfNotExists('cache_locks', ['expiration'], 'cache_locks_expiration_index');
            $this->addIndexIfNotExists('cache_locks', ['key'], 'cache_locks_key_index');
        }

        // Personal access tokens indexes
        if (Schema::hasTable('personal_access_tokens')) {
            $this->addIndexIfNotExists('personal_access_tokens', ['tokenable_id', 'tokenable_type'], 'personal_access_tokens_tokenable_id_tokenable_type_index');
            $this->addIndexIfNotExists('personal_access_tokens', ['name'], 'personal_access_tokens_name_index');
            $this->addIndexIfNotExists('personal_access_tokens', ['last_used_at'], 'personal_access_tokens_last_used_at_index');
        }

        // Sessions indexes
        if (Schema::hasTable('sessions')) {
            $this->addIndexIfNotExists('sessions', ['user_id'], 'sessions_user_id_index');
            $this->addIndexIfNotExists('sessions', ['last_activity'], 'sessions_last_activity_index');
        }

        // Password reset tokens indexes
        if (Schema::hasTable('password_reset_tokens')) {
            $this->addIndexIfNotExists('password_reset_tokens', ['email'], 'password_reset_tokens_email_index');
            $this->addIndexIfNotExists('password_reset_tokens', ['created_at'], 'password_reset_tokens_created_at_index');
        }

        // Model has roles indexes
        if (Schema::hasTable('model_has_roles')) {
            $this->addIndexIfNotExists('model_has_roles', ['model_id', 'model_type'], 'model_has_roles_model_id_model_type_index');
            $this->addIndexIfNotExists('model_has_roles', ['role_id'], 'model_has_roles_role_id_index');
        }

        // Model has permissions indexes
        if (Schema::hasTable('model_has_permissions')) {
            $this->addIndexIfNotExists('model_has_permissions', ['model_id', 'model_type'], 'model_has_permissions_model_id_model_type_index');
            $this->addIndexIfNotExists('model_has_permissions', ['permission_id'], 'model_has_permissions_permission_id_index');
        }

        // Role has permissions indexes
        if (Schema::hasTable('role_has_permissions')) {
            $this->addIndexIfNotExists('role_has_permissions', ['role_id'], 'role_has_permissions_role_id_index');
            $this->addIndexIfNotExists('role_has_permissions', ['permission_id'], 'role_has_permissions_permission_id_index');
        }

        // Roles indexes
        if (Schema::hasTable('roles')) {
            $this->addIndexIfNotExists('roles', ['name'], 'roles_name_index');
            $this->addIndexIfNotExists('roles', ['guard_name'], 'roles_guard_name_index');
        }

        // Permissions indexes
        if (Schema::hasTable('permissions')) {
            $this->addIndexIfNotExists('permissions', ['name'], 'permissions_name_index');
            $this->addIndexIfNotExists('permissions', ['guard_name'], 'permissions_guard_name_index');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration adds many indexes. In a production environment,
        // you might want to selectively drop indexes rather than dropping all of them.
        // For now, we'll leave the indexes in place as they improve performance.
        
        // If you need to remove specific indexes, you can do so manually:
        // Schema::table('table_name', function (Blueprint $table) {
        //     $table->dropIndex(['column_name']);
        // });
    }

    /**
     * Add index if it doesn't already exist
     */
    private function addIndexIfNotExists($table, $columns, $indexName)
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = '{$indexName}'");
            if (count($indexes) === 0) {
                Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                    if (is_array($columns)) {
                        $table->index($columns, $indexName);
                    } else {
                        $table->index($columns, $indexName);
                    }
                });
            }
        } catch (\Exception $e) {
            // Table might not exist or column might not exist, skip silently
        }
    }
};
