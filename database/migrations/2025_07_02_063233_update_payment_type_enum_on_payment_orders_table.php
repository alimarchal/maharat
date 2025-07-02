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
        // Update all previous/invalid payment_type values to 'Cash'
        DB::table('payment_orders')
            ->whereNotIn('payment_type', [
                'Cash',
                'Credit upto 30 days',
                'Credit upto 60 days',
                'Credit upto 90 days',
                'Credit upto 120 days'
            ])
            ->update(['payment_type' => 'Cash']);

        // Now safely alter the enum
        DB::statement("ALTER TABLE payment_orders MODIFY payment_type ENUM('Cash', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to the previous enum values if needed
        DB::statement("ALTER TABLE payment_orders MODIFY payment_type ENUM('Cash', 'Card', 'Bank Transfer', 'Cheque') NULL");
    }
};
