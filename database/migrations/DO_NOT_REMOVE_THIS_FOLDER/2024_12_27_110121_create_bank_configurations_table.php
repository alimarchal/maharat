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
        Schema::create('bank_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('bank_name');
            $table->string('bank_code');
            $table->string('branch_name')->nullable();
            $table->string('branch_code')->nullable();
            $table->string('account_number');
            $table->string('account_title');
            $table->string('iban')->nullable();
            $table->string('swift_code')->nullable();
            $table->string('routing_number')->nullable();
            $table->string('currency_code');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('api_settings')->nullable();
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
        Schema::dropIfExists('bank_configurations');
    }
};
