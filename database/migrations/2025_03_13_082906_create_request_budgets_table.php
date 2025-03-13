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
        Schema::create('request_budgets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('budget_id')->nullable()->constrained('budgets', 'id')->comment('Reference to the approved budget that resulted from this request');
            $table->foreignId('budget_category_id')->nullable()->constrained('budget_categories', 'id')->comment('Reference to the budget category this request belongs to');

            $table->foreignId('fiscal_period_id')->nullable()->comment('fiscal_periods is actual year')->constrained('fiscal_periods', 'id');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'id');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers', 'id');
            $table->foreignId('sub_cost_center')->nullable()->constrained('cost_centers', 'id');
            $table->decimal('previous_year_budget_amount', 15, 2)->nullable();
            $table->decimal('requested_amount', 15, 2)->nullable();
            $table->decimal('approved_amount', 15, 2)->nullable();
            $table->enum('urgency', ['High', 'Medium', 'Low'])->default(NULL)->nullable();
            $table->string('attachment_path')->nullable();
            $table->text('reason_for_increase')->nullable();
            $table->enum('status', ['Draft', 'Submitted', 'Referred','Approved','Rejected','Pending'])->default(NULL)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();  // For archiving without deletion

        });

/*
        // Insert sample data for various budget request scenarios
        DB::table('request_budgets')->insert([
            [
                'id' => 1,
                'budget_id' => 1, // Linked to Utilities budget
                'budget_category_id' => 3, // Utilities category
                'fiscal_period_id' => 1, // Fiscal Year 2025
                'department_id' => 2, // Facilities department
                'cost_center_id' => 5, // Facilities cost center
                'sub_cost_center' => null,
                'previous_year_budget_amount' => 100000.00,
                'requested_amount' => 120000.00,
                'approved_amount' => 120000.00,
                'urgency' => 'Medium',
                'attachment_path' => 'attachments/requests/utilities_2025_forecast.pdf',
                'reason_for_increase' => 'Expected 20% increase in electricity rates based on utility provider notifications.',
                'status' => 'Approved',
                'created_by' => 5, // Facilities Manager
                'updated_by' => 1, // Finance Director
                'created_at' => now()->subDays(90),
                'updated_at' => now()->subDays(65)
            ],
            [
                'id' => 2,
                'budget_id' => 1, // Linked to Utilities budget (supplemental request)
                'budget_category_id' => 3, // Utilities category
                'fiscal_period_id' => 1, // Fiscal Year 2025
                'department_id' => 2, // Facilities department
                'cost_center_id' => 5, // Facilities cost center
                'sub_cost_center' => null,
                'previous_year_budget_amount' => 120000.00, // Previously approved amount
                'requested_amount' => 15000.00, // Additional amount
                'approved_amount' => 15000.00,
                'urgency' => 'High',
                'attachment_path' => 'attachments/requests/supplemental_utilities_q2.pdf',
                'reason_for_increase' => 'Unexpected rate increase announced by electricity provider effective Q2.',
                'status' => 'Approved',
                'created_by' => 5, // Facilities Manager
                'updated_by' => 1, // Finance Director
                'created_at' => now()->subDays(40),
                'updated_at' => now()->subDays(30)
            ],
            [
                'id' => 3,
                'budget_id' => 2, // Linked to IT Equipment budget
                'budget_category_id' => 4, // IT Equipment category
                'fiscal_period_id' => 1, // Fiscal Year 2025
                'department_id' => 3, // IT department
                'cost_center_id' => 8, // IT cost center
                'sub_cost_center' => null,
                'previous_year_budget_amount' => 150000.00,
                'requested_amount' => 200000.00,
                'approved_amount' => 200000.00,
                'urgency' => 'Medium',
                'attachment_path' => 'attachments/requests/it_equipment_2025_plan.pdf',
                'reason_for_increase' => 'Planned replacement of outdated workstations and server infrastructure upgrades.',
                'status' => 'Approved',
                'created_by' => 8, // IT Director
                'updated_by' => 1, // Finance Director
                'created_at' => now()->subDays(95),
                'updated_at' => now()->subDays(65)
            ],
            [
                'id' => 4,
                'budget_id' => null, // Pending approval, not yet linked to a budget
                'budget_category_id' => 4, // IT Equipment category
                'fiscal_period_id' => 1, // Fiscal Year 2025
                'department_id' => 3, // IT department
                'cost_center_id' => 8, // IT cost center
                'sub_cost_center' => null,
                'previous_year_budget_amount' => 0.00, // New initiative
                'requested_amount' => 75000.00,
                'approved_amount' => null, // Not yet approved
                'urgency' => 'High',
                'attachment_path' => 'attachments/requests/cybersecurity_initiative.pdf',
                'reason_for_increase' => 'Critical cybersecurity infrastructure enhancements required following security audit.',
                'status' => 'Submitted',
                'created_by' => 8, // IT Director
                'updated_by' => 8,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5)
            ],
            [
                'id' => 5,
                'budget_id' => null, // Draft request, not yet submitted
                'budget_category_id' => 1, // Operating Expenses category
                'fiscal_period_id' => 1, // Fiscal Year 2025
                'department_id' => 4, // Marketing department
                'cost_center_id' => 10, // Marketing cost center
                'sub_cost_center' => 11, // Digital Marketing sub-cost center
                'previous_year_budget_amount' => 250000.00,
                'requested_amount' => 325000.00,
                'approved_amount' => null,
                'urgency' => 'Medium',
                'attachment_path' => 'attachments/requests/marketing_campaign_2025.pdf',
                'reason_for_increase' => 'Expansion into new market segments requiring additional promotional activities.',
                'status' => 'Draft',
                'created_by' => 12, // Marketing Manager
                'updated_by' => 12,
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(1)
            ],
            [
                'id' => 6,
                'budget_id' => null,
                'budget_category_id' => 2, // Capital Expenditures
                'fiscal_period_id' => 1, // Fiscal Year 2025
                'department_id' => 2, // Facilities department
                'cost_center_id' => 5, // Facilities cost center
                'sub_cost_center' => null,
                'previous_year_budget_amount' => 0.00, // New initiative
                'requested_amount' => 450000.00,
                'approved_amount' => null,
                'urgency' => 'Low',
                'attachment_path' => 'attachments/requests/office_renovation_proposal.pdf',
                'reason_for_increase' => 'Office renovation to accommodate growing workforce and improve workspace efficiency.',
                'status' => 'Referred',
                'created_by' => 5, // Facilities Manager
                'updated_by' => 2, // CEO
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(10)
            ]
        ]);
*/
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_budgets');
    }
};
