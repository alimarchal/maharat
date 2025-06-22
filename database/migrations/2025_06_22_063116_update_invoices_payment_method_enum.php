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
        // 1. Expand the enum to allow all possible values
        DB::statement("ALTER TABLE invoices MODIFY COLUMN payment_method ENUM('Cash', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days', 'Bank Transfer', 'Credit Card') NULL");

        // 2. Update any existing values to match the new enum
        DB::table('invoices')->where('payment_method', 'Credit')->update(['payment_method' => 'Credit upto 30 days']);
        DB::table('invoices')->where('payment_method', 'Bank Transfer')->update(['payment_method' => 'Cash']);
        DB::table('invoices')->where('payment_method', 'Credit Card')->update(['payment_method' => 'Cash']);

        // 3. Restrict the enum to only the new values
        DB::statement("ALTER TABLE invoices MODIFY COLUMN payment_method ENUM('Cash', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Expand the enum to allow all possible values
        DB::statement("ALTER TABLE invoices MODIFY COLUMN payment_method ENUM('Cash', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days', 'Bank Transfer', 'Credit Card') NULL");

        // 2. Update any credit options back to 'Credit', and restore old values
        DB::table('invoices')->whereIn('payment_method', ['Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days'])->update(['payment_method' => 'Credit']);

        // 3. Revert back to string column
        DB::statement("ALTER TABLE invoices MODIFY COLUMN payment_method VARCHAR(255) NULL");
    }
};
