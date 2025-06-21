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
        // For MySQL, alter enum by using raw SQL
        DB::statement("ALTER TABLE budgets MODIFY COLUMN status ENUM('Pending', 'Active', 'Frozen', 'Closed') NOT NULL DEFAULT 'Pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \DB::statement("ALTER TABLE budgets MODIFY COLUMN status ENUM('Active', 'Frozen', 'Closed') NOT NULL DEFAULT 'Active'");
    }
};
