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
        // 1. Temporarily expand the enum to allow all possible values
        DB::statement("ALTER TABLE external_invoices MODIFY COLUMN type ENUM('Cash', 'Credit', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days') NULL");

        // 2. Update any existing 'Credit' values to 'Credit upto 30 days'
        DB::table('external_invoices')
            ->where('type', 'Credit')
            ->update(['type' => 'Credit upto 30 days']);

        // 3. Restrict the enum to only the new values
        DB::statement("ALTER TABLE external_invoices MODIFY COLUMN type ENUM('Cash', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Expand the enum to allow all possible values
        DB::statement("ALTER TABLE external_invoices MODIFY COLUMN type ENUM('Cash', 'Credit', 'Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days') NULL");

        // 2. Update any credit options back to 'Credit'
        DB::table('external_invoices')
            ->whereIn('type', ['Credit upto 30 days', 'Credit upto 60 days', 'Credit upto 90 days', 'Credit upto 120 days'])
            ->update(['type' => 'Credit']);

        // 3. Restrict the enum to only the original values
        DB::statement("ALTER TABLE external_invoices MODIFY COLUMN type ENUM('Cash', 'Credit') NULL");
    }
};
