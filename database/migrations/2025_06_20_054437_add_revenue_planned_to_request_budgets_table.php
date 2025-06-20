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
        Schema::table('request_budgets', function (Blueprint $table) {
            $table->decimal('revenue_planned', 15, 2)->nullable()->after('requested_amount')->comment('Planned revenue for this budget request');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_budgets', function (Blueprint $table) {
            $table->dropColumn('revenue_planned');
        });
    }
};
