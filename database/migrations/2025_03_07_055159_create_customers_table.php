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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            // Basic customer information
            $table->string('name');
            $table->string('commercial_registration_number')->nullable()->unique();
            $table->string('tax_number')->nullable()->unique();
            $table->string('tax_group_registration_number')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('additional_number')->nullable();
            $table->string('client_code')->nullable();
            $table->string('license_number')->nullable();
            $table->string('type')->default('regular'); // Can be 'vendor', 'client', 'both'
            $table->boolean('is_limited')->default(false);

            // Address fields
            $table->string('street_name')->nullable();
            $table->string('building_number')->nullable();
            $table->string('address_additional_number')->nullable();
            $table->string('district')->nullable();
            $table->string('neighborhood')->nullable();
            $table->string('main_street')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('country_code', 3)->nullable(); // ISO country code e.g., 'SA'

            // Bank account fields
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('iban')->nullable();
            $table->string('swift_code')->nullable();
            $table->string('branch_name')->nullable();
            $table->string('bank_currency', 3)->nullable()->default('SAR');

            // Payment method preference
            $table->string('preferred_payment_method')->nullable();

            // Tax rate information
            $table->decimal('default_tax_rate', 8, 2)->nullable();
            $table->boolean('is_tax_exempt')->default(false);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
