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
        Schema::create('posting_intervals', function (Blueprint $table) {
            $table->id();
            $table->integer('basic_posting_interval')->default(15);
            $table->integer('max_posting_interval')->default(30);
            $table->integer('min_posting_invoice_count')->default(10);
            $table->integer('max_posting_invoice_count')->default(100);
            $table->boolean('is_service_active')->default(true);
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posting_intervals');
    }
};
