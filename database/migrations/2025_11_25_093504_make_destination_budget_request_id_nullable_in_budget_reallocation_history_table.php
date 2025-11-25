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
        Schema::table('budget_reallocation_history', function (Blueprint $table) {
            // Drop the foreign key first
            $table->dropForeign('brh_dest_budget_fk');
            
            // Make destination_budget_request_id nullable
            $table->unsignedBigInteger('destination_budget_request_id')->nullable()->change();
            
            // Make destination-related fields nullable since destination may not be set initially
            $table->decimal('destination_old_balance', 15, 2)->nullable()->change();
            $table->decimal('destination_new_balance', 15, 2)->nullable()->change();
            
            // Re-add the foreign key with nullable support
            $table->foreign('destination_budget_request_id', 'brh_dest_budget_fk')->references('id')->on('request_budgets');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('budget_reallocation_history', function (Blueprint $table) {
            // Drop the foreign key
            $table->dropForeign('brh_dest_budget_fk');
            
            // Make destination_budget_request_id not nullable again
            $table->unsignedBigInteger('destination_budget_request_id')->nullable(false)->change();
            
            // Make destination-related fields not nullable again
            $table->decimal('destination_old_balance', 15, 2)->nullable(false)->change();
            $table->decimal('destination_new_balance', 15, 2)->nullable(false)->change();
            
            // Re-add the foreign key
            $table->foreign('destination_budget_request_id', 'brh_dest_budget_fk')->references('id')->on('request_budgets');
        });
    }
};
