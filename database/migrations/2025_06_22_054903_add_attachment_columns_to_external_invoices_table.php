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
        Schema::table('external_invoices', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('status');
            $table->string('original_name')->nullable()->after('attachment_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('external_invoices', function (Blueprint $table) {
            $table->dropColumn(['attachment_path', 'original_name']);
        });
    }
};
