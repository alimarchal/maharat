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
        // Add 'Partially Paid' to the status enum
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('Draft', 'Approved', 'Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'Partially Paid' from the status enum
        DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('Draft', 'Approved', 'Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft'");
    }
};
