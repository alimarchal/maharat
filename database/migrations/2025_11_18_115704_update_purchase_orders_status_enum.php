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
        // Update the status enum to include 'Pending Reallocation'
        DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Approved','Draft', 'Rejected', 'Pending', 'Pending Reallocation') DEFAULT 'Draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Approved','Draft', 'Rejected', 'Pending') DEFAULT 'Approved'");
    }
};
