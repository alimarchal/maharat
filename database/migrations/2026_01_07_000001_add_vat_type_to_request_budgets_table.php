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
        // Extend the `type` enum on request_budgets to support 'vat' as a third option
        DB::statement("
            ALTER TABLE request_budgets
            MODIFY COLUMN type ENUM('budget_request','reallocation','vat') NOT NULL DEFAULT 'budget_request'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum without 'vat'
        DB::statement("
            ALTER TABLE request_budgets
            MODIFY COLUMN type ENUM('budget_request','reallocation') NOT NULL DEFAULT 'budget_request'
        ");
    }
};


