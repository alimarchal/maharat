<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('fiscal_periods')) {
            Schema::create('fiscal_periods', function (Blueprint $table) {
                $table->id();
                $table->date('fiscal_year');
                $table->integer('period_number');
                $table->string('period_name');
                $table->date('start_date');
                $table->date('end_date');
                $table->date('transaction_closed_upto')->nullable();
                $table->enum('status', ['Open', 'Closed', 'Adjusting'])->default('Open');
                $table->foreignId('created_by')->nullable()->constrained('users', 'id')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users', 'id')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        /*

       Schema::create('accounting_dimensions', function (Blueprint $table) {
           // Primary identifier using Laravel's default id column
           $table->id();

           // Core dimension attributes
           $table->string('dimension_id', 50)->unique()->comment('Business identifier code for the dimension');
           $table->string('dimension_name', 100)->comment('Human-readable name of the dimension');
           $table->string('dimension_type', 50)->comment('Categorizes dimension (Department, Project, Cost Center, etc.)');
           $table->boolean('is_active')->default(true)->comment('Controls whether dimension is available for selection');

           // Audit fields
           $table->dateTime('created_date')->comment('Timestamp when record was created');
           $table->dateTime('modified_date')->nullable()->comment('Timestamp of last modification');
           $table->string('created_by', 50)->comment('User who created the dimension');
           $table->string('modified_by', 50)->nullable()->comment('User who last modified the dimension');

           // Hierarchical relationship attributes
           $table->integer('hierarchy_level')->nullable()->comment('Depth level in dimension tree structure');
           $table->unsignedBigInteger('parent_dimension_id')->nullable()->comment('Reference to parent dimension for hierarchical structures');

           // Additional configuration attributes
           $table->text('description')->nullable()->comment('Detailed explanation of dimension purpose and usage');
           $table->boolean('is_mandatory')->default(false)->comment('Requires value assignment in transactions');
           $table->string('applies_to_module', 100)->nullable()->comment('Specific functional areas where dimension is relevant');
           $table->string('validation_rule', 255)->nullable()->comment('Business rules for validating dimension values');
           $table->string('default_value', 100)->nullable()->comment('Pre-populated value when none is specified');
           $table->integer('sort_order')->nullable()->comment('Controls display sequence in UI');
           $table->string('company_id', 50)->comment('Associates dimension with specific company entity');

           // Standard Laravel timestamps
           $table->timestamps();

           // Foreign key relationship for self-referencing hierarchy
           $table->foreign('parent_dimension_id')
               ->references('id')
               ->on('accounting_dimensions')
               ->onDelete('set null');

           // Performance optimization indexes
           $table->index('dimension_type');
           $table->index('company_id');
       });


       // Journals table - Records financial transactions, providing a chronological record of all financial events
       Schema::create('journals', function (Blueprint $table) {
           $table->id();
           $table->string('journal_code')->unique()->comment('Unique code for the journal');
           $table->string('journal_name')->comment('Name of the journal');
           $table->enum('journal_type', ['General', 'Purchases', 'Sales', 'Cash', 'Fixed Assets'])->comment('Type of journal');
           $table->text('description')->nullable()->comment('Brief description of the journal');
           $table->boolean('is_active')->default(true)->comment('Status of the journal');
           $table->timestamps();
           $table->softDeletes()->comment('Soft delete column to track deleted journals');
       });

       // Journal entries table - Records individual transactions within a journal
       Schema::create('journal_entries', function (Blueprint $table) {
           $table->id();
           $table->foreignId('journal_id')->comment('Reference to the journal type');
           $table->string('entry_number')->comment('Unique sequential number for the journal entry');
           $table->date('entry_date')->comment('Date when the transaction occurred');
           $table->foreignId('fiscal_period_id')->comment('Reference to the fiscal period');
           $table->string('reference_number')->nullable()->comment('External reference number');
           $table->text('description')->nullable()->comment('Description of the journal entry');
           $table->enum('status', ['Draft', 'Posted', 'Reversed'])->default('Draft')->comment('Current status of the entry');
           $table->foreignId('created_by')->comment('User who created the entry');
           $table->foreignId('posted_by')->nullable()->comment('User who posted the entry');
           $table->timestamp('posted_at')->nullable()->comment('Timestamp of posting');
           $table->timestamps();

           $table->foreign('journal_id')->references('id')->on('journals');
           $table->foreign('fiscal_period_id')->references('id')->on('fiscal_periods');
           $table->index(['entry_date', 'status']);
       });

       // Journal lines table - Detail lines within journal entries
       Schema::create('journal_lines', function (Blueprint $table) {
           $table->id();
           $table->foreignId('journal_entry_id')->comment('Reference to the parent journal entry');
           $table->integer('line_number')->comment('Sequential line number within the journal entry');
           $table->foreignId('account_id')->comment('Reference to the GL account');
           $table->text('description')->nullable()->comment('Description for this specific line item');
           $table->decimal('debit_amount', 15, 2)->default(0)->comment('Debit amount for this line');
           $table->decimal('credit_amount', 15, 2)->default(0)->comment('Credit amount for this line');
           $table->foreignId('currency_id')->comment('Currency of the transaction');
           $table->decimal('exchange_rate', 15, 6)->default(1)->comment('Exchange rate to base currency');
           $table->foreignId('department_id')->nullable()->comment('Department dimension reference');
           $table->foreignId('cost_center_id')->nullable()->comment('Cost center dimension reference');
           $table->timestamps();

           $table->foreign('journal_entry_id')->references('id')->on('journal_entries')->onDelete('cascade');
           $table->foreign('account_id')->references('id')->on('chart_of_accounts');
           $table->foreign('currency_id')->references('id')->on('currencies');
           $table->foreign('department_id')->references('id')->on('accounting_dimensions');
           $table->foreign('cost_center_id')->references('id')->on('accounting_dimensions');
           $table->index(['account_id', 'journal_entry_id']);
       });

       // General ledger table - Master accounting record
       Schema::create('general_ledger', function (Blueprint $table) {
           $table->id();
           $table->date('transaction_date')->comment('Date when the transaction occurred');
           $table->date('posting_date')->comment('Date when transaction was posted to ledger');
           $table->foreignId('journal_entry_id')->comment('Reference to the source journal entry');
           $table->foreignId('account_id')->comment('Reference to the GL account');
           $table->string('document_number')->nullable()->comment('Reference number for source document');
           $table->text('description')->nullable()->comment('Description of the transaction');
           $table->decimal('debit_amount', 15, 2)->default(0)->comment('Debit amount');
           $table->decimal('credit_amount', 15, 2)->default(0)->comment('Credit amount');
           $table->decimal('running_balance', 15, 2)->comment('Cumulative balance for this account');
           $table->foreignId('currency_id')->comment('Currency of the transaction');
           $table->decimal('exchange_rate', 15, 6)->default(1)->comment('Exchange rate to base currency');
           $table->decimal('base_currency_amount', 15, 2)->comment('Amount in organization base currency');
           $table->foreignId('fiscal_period_id')->comment('Reference to fiscal period');
           $table->foreignId('department_id')->nullable()->comment('Department dimension reference');
           $table->foreignId('cost_center_id')->nullable()->comment('Cost center dimension reference');
           $table->foreignId('project_id')->nullable()->comment('Project dimension reference');
           $table->string('segment_1')->nullable()->comment('Additional analysis segment 1');
           $table->string('segment_2')->nullable()->comment('Additional analysis segment 2');
           $table->string('segment_3')->nullable()->comment('Additional analysis segment 3');
           $table->boolean('is_reconciled')->default(false)->comment('Whether entry has been reconciled');
           $table->timestamp('reconciled_at')->nullable()->comment('Timestamp of reconciliation');
           $table->foreignId('created_by')->comment('User who created the entry');
           $table->timestamps();

           $table->foreign('journal_entry_id')->references('id')->on('journal_entries');
           $table->foreign('account_id')->references('id')->on('chart_of_accounts');
           $table->foreign('currency_id')->references('id')->on('currencies');
           $table->foreign('fiscal_period_id')->references('id')->on('fiscal_periods');
           $table->foreign('department_id')->references('id')->on('accounting_dimensions');
           $table->foreign('cost_center_id')->references('id')->on('accounting_dimensions');
           $table->foreign('project_id')->references('id')->on('accounting_dimensions');
           $table->index(['account_id', 'fiscal_period_id']);
           $table->index(['transaction_date', 'posting_date']);
       });

       // Budget entries table
       Schema::create('budget_entries', function (Blueprint $table) {
           $table->id();
           $table->foreignId('fiscal_period_id')->comment('Reference to the fiscal period');
           $table->foreignId('account_id')->comment('Reference to the GL account');
           $table->foreignId('dimension_id')->nullable()->comment('Reference to analytical dimension');
           $table->decimal('budget_amount', 15, 2)->comment('Budgeted amount for this period');
           $table->text('description')->nullable()->comment('Description of the budget entry');
           $table->foreignId('created_by')->comment('User who created the entry');
           $table->timestamps();

           $table->foreign('fiscal_period_id')->references('id')->on('fiscal_periods');
           $table->foreign('account_id')->references('id')->on('chart_of_accounts');
           $table->foreign('dimension_id')->references('id')->on('accounting_dimensions');
           $table->unique(['fiscal_period_id', 'account_id', 'dimension_id'], 'budget_unique_constraint');
       });

       // Accounts receivable table
       Schema::create('accounts_receivable', function (Blueprint $table) {
           $table->id();
           $table->foreignId('customer_id')->comment('Reference to customer record');
           $table->string('invoice_number')->comment('Unique invoice identifier');
           $table->date('invoice_date')->comment('Date the invoice was issued');
           $table->date('due_date')->comment('Date payment is due');
           $table->decimal('amount', 15, 2)->comment('Total invoice amount');
           $table->enum('status', ['Open', 'Partial', 'Closed'])->default('Open')->comment('Payment status');
           $table->foreignId('journal_entry_id')->nullable()->comment('Reference to journal entry');
           $table->timestamps();

           $table->foreign('journal_entry_id')->references('id')->on('journal_entries');
           $table->index(['customer_id', 'status']);
           $table->index(['due_date', 'status']);
           $table->unique('invoice_number');
       });

       // Accounts payable table
       Schema::create('accounts_payable', function (Blueprint $table) {
           $table->id();
           $table->foreignId('vendor_id')->comment('Reference to vendor record');
           $table->string('invoice_number')->comment('Vendor invoice identifier');
           $table->date('invoice_date')->comment('Date of the vendor invoice');
           $table->date('due_date')->comment('Date payment is due');
           $table->decimal('amount', 15, 2)->comment('Total invoice amount');
           $table->enum('status', ['Open', 'Partial', 'Closed'])->default('Open')->comment('Payment status');
           $table->foreignId('journal_entry_id')->nullable()->comment('Reference to journal entry');
           $table->timestamps();

           $table->foreign('journal_entry_id')->references('id')->on('journal_entries');
           $table->index(['vendor_id', 'status']);
           $table->index(['due_date', 'status']);
           $table->index(['invoice_number', 'vendor_id']);
       });

       // Tax codes table
       Schema::create('tax_codes', function (Blueprint $table) {
           $table->id();
           $table->string('tax_code')->unique()->comment('Unique identifier for the tax code');
           $table->string('tax_name')->comment('Descriptive name of the tax');
           $table->decimal('tax_rate', 8, 4)->comment('The percentage rate for this tax');
           $table->boolean('is_active')->default(true)->comment('Whether this tax code is active');
           $table->timestamps();

           $table->index('is_active');
       });

       // Fixed assets table
       Schema::create('fixed_assets', function (Blueprint $table) {
           $table->id();
           $table->string('asset_code')->unique()->comment('Unique identifier for the asset');
           $table->string('asset_name')->comment('Descriptive name of the asset');
           $table->date('acquisition_date')->comment('Date the asset was acquired');
           $table->decimal('acquisition_cost', 15, 2)->comment('Original purchase cost');
           $table->enum('depreciation_method', ['Straight Line', 'Declining Balance', 'Units of Production'])->comment('Method used for depreciation');
           $table->integer('useful_life_months')->comment('Expected life of asset in months');
           $table->decimal('salvage_value', 15, 2)->default(0)->comment('Estimated value at end of life');
           $table->foreignId('account_id')->comment('Associated GL asset account');
           $table->timestamps();

           $table->foreign('account_id')->references('id')->on('chart_of_accounts');
           $table->index('acquisition_date');
       });

       // Bank accounts table
       Schema::create('bank_accounts', function (Blueprint $table) {
           $table->id();
           $table->foreignId('account_id')->comment('Reference to GL account');
           $table->string('bank_name')->comment('Name of the bank');
           $table->string('account_number')->comment('Bank account number');
           $table->foreignId('currency_id')->comment('Currency of the bank account');
           $table->boolean('is_active')->default(true)->comment('Whether this account is active');
           $table->timestamps();

           $table->foreign('account_id')->references('id')->on('chart_of_accounts');
           $table->foreign('currency_id')->references('id')->on('currencies');
           $table->unique(['bank_name', 'account_number']);
           $table->index('is_active');
       });
       */
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiscal_periods');

        /*
         Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('fixed_assets');
        Schema::dropIfExists('tax_codes');
        Schema::dropIfExists('accounts_payable');
        Schema::dropIfExists('accounts_receivable');
        Schema::dropIfExists('budget_entries');
        Schema::dropIfExists('general_ledger');
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('journals');
        Schema::dropIfExists('accounting_dimensions');
         */
    }
};
