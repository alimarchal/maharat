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
        Schema::table('fiscal_periods', function (Blueprint $table) {
            $table->string('budget_name')->nullable()->after('period_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_periods', function (Blueprint $table) {
            $table->dropColumn('budget_name');
        });
    }
};
