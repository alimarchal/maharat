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
        Schema::table('item_requests', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['status_id']);
            
            // Drop the status_id column
            $table->dropColumn('status_id');
            
            // Add the new status column as enum
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_requests', function (Blueprint $table) {
            // Drop the status column
            $table->dropColumn('status');
            
            // Add back the status_id column
            $table->foreignId('status_id')->nullable()->constrained('statuses')->default(1);
        });
    }
};
