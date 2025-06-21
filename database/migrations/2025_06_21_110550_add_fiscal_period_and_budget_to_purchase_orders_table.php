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
            $table->foreignId('fiscal_period_id')->nullable()->constrained('fiscal_periods')->onDelete('set null');
            $table->foreignId('request_budget_id')->nullable()->constrained('request_budgets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['fiscal_period_id']);
            $table->dropForeign(['request_budget_id']);
            $table->dropColumn(['fiscal_period_id', 'request_budget_id']);
        });
    }
};
