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
        Schema::create('budget_reallocation_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reallocation_request_id')->comment('Reference to the reallocation request_budget record');
            $table->unsignedBigInteger('source_budget_request_id')->comment('Source budget request being reallocated from');
            $table->unsignedBigInteger('destination_budget_request_id')->comment('Destination budget request being reallocated to');
            
            // Add foreign keys with custom short names to avoid MariaDB identifier length limit (64 chars)
            $table->foreign('reallocation_request_id', 'brh_realloc_req_fk')->references('id')->on('request_budgets');
            $table->foreign('source_budget_request_id', 'brh_src_budget_fk')->references('id')->on('request_budgets');
            $table->foreign('destination_budget_request_id', 'brh_dest_budget_fk')->references('id')->on('request_budgets');
            $table->decimal('reallocate_amount', 15, 2)->comment('Amount being reallocated');
            $table->decimal('source_old_balance', 15, 2)->comment('Source balance before reallocation');
            $table->decimal('source_new_balance', 15, 2)->comment('Source balance after reallocation');
            $table->decimal('destination_old_balance', 15, 2)->comment('Destination balance before reallocation');
            $table->decimal('destination_new_balance', 15, 2)->comment('Destination balance after reallocation');
            $table->decimal('source_old_approved_amount', 15, 2)->nullable()->comment('Source approved_amount before final approval');
            $table->decimal('source_new_approved_amount', 15, 2)->nullable()->comment('Source approved_amount after final approval');
            $table->decimal('destination_old_approved_amount', 15, 2)->nullable()->comment('Destination approved_amount before final approval');
            $table->decimal('destination_new_approved_amount', 15, 2)->nullable()->comment('Destination approved_amount after final approval');
            $table->enum('status', ['Draft', 'Pending', 'Approved', 'Rejected'])->default('Draft')->comment('Status of this reallocation transaction');
            $table->text('notes')->nullable()->comment('Additional notes about this reallocation');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('created_by', 'brh_created_by_fk')->references('id')->on('users');
            $table->foreign('updated_by', 'brh_updated_by_fk')->references('id')->on('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('budget_reallocation_history', function (Blueprint $table) {
            $table->dropForeign('brh_realloc_req_fk');
            $table->dropForeign('brh_src_budget_fk');
            $table->dropForeign('brh_dest_budget_fk');
            $table->dropForeign('brh_created_by_fk');
            $table->dropForeign('brh_updated_by_fk');
        });
        Schema::dropIfExists('budget_reallocation_history');
    }
};
