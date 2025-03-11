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
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('tax_group_id')->unique();
            $table->string('tax_group_name');
            $table->enum('module', ['purchase', 'sales', 'financial_accounting']);
            $table->enum('type', ['product_tax', 'global_tax']);
            $table->decimal('tax_percentage', 5, 2)->default(0);
            $table->decimal('fixed_amount', 10, 2)->nullable();
            $table->boolean('is_fixed_amount')->default(false);
            $table->string('calculate_on')->nullable(); // base_amount, item_value etc
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_bundled_with_price')->default(false);
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
        Schema::dropIfExists('tax_rates');
    }
};
