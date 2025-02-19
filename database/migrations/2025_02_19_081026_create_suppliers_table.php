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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable()->comment('Supplier company name');
            $table->string('code')->nullable()->comment('Supplier ID (e.g., SUP-001)')->unique();
            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('tax_number')->comment('VAT/TIN')->nullable();
            $table->text('payment_terms')->nullable();
            $table->boolean('is_approved')->comment('Approval status')->default(false);
            $table->foreignId('currency_id')->nullable()->constrained('currencies', 'id');
            $table->foreignId('status_id')->nullable()->constrained('statuses', 'id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
