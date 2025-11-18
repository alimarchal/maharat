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
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('alternative_sub_cost_center_id')->nullable()->after('sub_cost_center_id')->constrained('cost_centers', 'id')->onDelete('set null');
            $table->decimal('alternative_budget_amount', 15, 2)->nullable()->default(0)->after('alternative_sub_cost_center_id');
            $table->foreignId('alternative_request_budget_id')->nullable()->after('alternative_budget_amount')->constrained('request_budgets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['alternative_sub_cost_center_id']);
            $table->dropForeign(['alternative_request_budget_id']);
            $table->dropColumn(['alternative_sub_cost_center_id', 'alternative_budget_amount', 'alternative_request_budget_id']);
        });
    }
};
