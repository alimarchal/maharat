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
        Schema::table('transactions_flow', function (Blueprint $table) {
            $table->string('attachment')->nullable()->comment('Path to the attached file');
            $table->string('original_name')->nullable()->comment('Original filename of the attached file');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions_flow', function (Blueprint $table) {
            $table->dropColumn(['attachment', 'original_name']);
        });
    }
};
