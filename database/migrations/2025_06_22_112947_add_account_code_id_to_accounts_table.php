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
        Schema::table('accounts', function (Blueprint $table) {
            $table->unsignedBigInteger('account_code_id')->nullable()->after('chart_of_account_id');
            $table->foreign('account_code_id')->references('id')->on('account_codes')->onDelete('set null');
        });

        // Data migration: Populate the new column from the chart_of_accounts table
        DB::statement('
            UPDATE accounts a
            JOIN chart_of_accounts coa ON a.chart_of_account_id = coa.id
            SET a.account_code_id = coa.account_code_id
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropForeign(['account_code_id']);
            $table->dropColumn('account_code_id');
        });
    }
};
