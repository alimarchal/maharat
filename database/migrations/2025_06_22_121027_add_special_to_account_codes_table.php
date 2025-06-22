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
        // Modify the ENUM column to include 'Special'
        DB::statement("ALTER TABLE account_codes MODIFY COLUMN account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Special') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the ENUM column to its original state, excluding 'Special'
        DB::statement("ALTER TABLE account_codes MODIFY COLUMN account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL");
    }
};
