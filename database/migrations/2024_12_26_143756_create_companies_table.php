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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar')->nullable(); // For Arabic name
            $table->string('email');
            $table->string('contact_number');
            $table->string('fax')->nullable();
            $table->string('country');
            $table->string('city');
            $table->string('states_provinces')->nullable();
            $table->string('district')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('street_name')->nullable();
            $table->string('additional_street')->nullable();
            $table->string('building_number')->nullable();
            $table->string('additional_number')->nullable();
            $table->string('short_address')->nullable();
            $table->string('business_category')->nullable();
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('stamp_path')->nullable();
            // Company Settings
            $table->date('fiscal_year_start');
            $table->date('fiscal_year_end');
            $table->decimal('price_decimals',10,2)->default(0);
            $table->decimal('quantity_decimals',10,2)->default(0);
            $table->decimal('amount_decimals',10,2)->default(0);
            $table->decimal('gazt_amount_decimals',10,2)->default(0);
            $table->string('currency')->default('SAR');
            $table->string('timezone')->default('UTC+03:00');
            $table->integer('session_expired_time')->default(5000);
            $table->boolean('stop_login')->default(false);
            $table->boolean('loyalty_use_phone_as_card')->default(false);
            $table->enum('zatca_environment', ['sandbox', 'production'])->default('sandbox');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
