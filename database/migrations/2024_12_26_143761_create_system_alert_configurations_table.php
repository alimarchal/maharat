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
        Schema::create('system_alert_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // Purchase Order Listing, etc
            $table->string('type');              // purchase, sales, inventory
            $table->enum('frequency', ['daily', 'weekly', '15_days', 'monthly', 'custom']);
            $table->json('alert_rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_alert_configurations');
    }
};
