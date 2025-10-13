<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the enum to include 'Refer' status
        DB::statement("ALTER TABLE grn_approval_transactions MODIFY COLUMN status ENUM('Pending', 'Approve', 'Reject', 'Refer') DEFAULT 'Pending'");
    }

    public function down(): void
    {
        // Revert the enum back to original values
        DB::statement("ALTER TABLE grn_approval_transactions MODIFY COLUMN status ENUM('Pending', 'Approve', 'Reject') DEFAULT 'Pending'");
    }
};