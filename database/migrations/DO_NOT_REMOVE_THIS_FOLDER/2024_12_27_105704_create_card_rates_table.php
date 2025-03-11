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
        Schema::create('card_rates', function (Blueprint $table) {
            $table->id();
            $table->string('card_code')->unique();
            $table->string('card_name');
            $table->string('bank_code')->nullable();
            $table->string('bank_name')->nullable();
            $table->boolean('is_default_card')->default(false);

            // Adjust To Invoice
            $table->decimal('bank_rate', 5, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('min_bank_charges', 10, 2)->nullable();
            $table->decimal('max_bank_charges', 10, 2)->nullable();

            // Charges To Customer
            $table->decimal('customer_bank_rate', 5, 2)->default(0);
            $table->decimal('customer_tax_rate', 5, 2)->default(0);
            $table->decimal('customer_min_charges', 10, 2)->nullable();
            $table->decimal('customer_max_charges', 10, 2)->nullable();

            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_rates');
    }
};
