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
        Schema::create('budget_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_budget_id')->constrained('budgets', 'id')->comment('Reference to the budget from which funds are being transferred');
            $table->foreignId('destination_budget_id')->constrained('budgets', 'id')->comment('Reference to the budget to which funds are being transferred');
            $table->decimal('amount', 15, 2)->comment('The monetary amount being transferred between budgets');
            $table->foreignId('request_budget_id')->nullable()->constrained('request_budgets', 'id')->comment('Reference to the budget request that prompted this transfer, if applicable');
            $table->text('reason')->nullable()->comment('Justification or business reason for this budget transfer');
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending')->comment('Current approval status of the transfer request');
            $table->foreignId('approved_by')->nullable()->constrained('users', 'id')->comment('Reference to the user who approved or rejected this transfer');
            $table->date('approval_date')->nullable()->comment('Date when this transfer was approved or rejected');
            $table->foreignId('created_by')->constrained('users', 'id')->comment('Reference to the user who initiated this transfer');
            $table->timestamps();
            $table->softDeletes()->comment('Enables archiving of transfer records without permanent deletion');
        });
/*
        // Insert sample data
        DB::table('budget_transfers')->insert([
            [
                'source_budget_id' => 2, // IT Equipment budget
                'destination_budget_id' => 1, // Utilities budget
                'amount' => 20000.00,
                'request_budget_id' => 4,
                'reason' => 'Transfer funds from IT Equipment to cover unexpected increase in utility costs',
                'status' => 'Approved',
                'approved_by' => 2,
                'approval_date' => now()->subDays(3),
                'created_by' => 1,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3)
            ],
            [
                'source_budget_id' => 2, // IT Equipment budget
                'destination_budget_id' => 3, // IT OPEX budget
                'amount' => 15000.00,
                'request_budget_id' => null,
                'reason' => 'Allocate funds for urgent cybersecurity project',
                'status' => 'Pending',
                'approved_by' => null,
                'approval_date' => null,
                'created_by' => 4,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1)
            ]
        ]);
*/
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_transfers');
    }
};
