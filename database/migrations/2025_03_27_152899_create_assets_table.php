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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('asset_code')->unique();
            $table->enum('type', ['fixed', 'current', 'intangible']);
            $table->enum('status', ['active', 'disposed', 'written_off', 'sold']);
            $table->decimal('acquisition_cost', 15, 2);
            $table->decimal('current_value', 15, 2);
            $table->decimal('salvage_value', 15, 2)->default(0);
            $table->date('acquisition_date');
            $table->date('disposal_date')->nullable();
            $table->integer('useful_life_years')->nullable();
            $table->enum('depreciation_method', ['straight_line', 'declining_balance', 'units_of_production', 'none'])->default('none');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('department')->nullable();
            $table->boolean('is_leased')->default(false);
            $table->date('lease_expiry_date')->nullable();
            $table->timestamps();
            $table->userTracking();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
