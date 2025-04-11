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
        Schema::create('budget_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_cost_center')->nullable()->constrained('cost_centers', 'id');
            $table->foreignId('fiscal_period_id')->nullable()->comment('fiscal_periods is actual year')->constrained('fiscal_periods', 'id');
            $table->decimal('sub_cost_center_approved_amount', 15, 2)->comment('At the time of crations')->nullable();
            $table->decimal('sub_cost_center_reserved_amount', 15, 2)->comment('At the time of Purchase Order Creations')->nullable();
            $table->decimal('sub_cost_center_consumed_amount', 15, 2)->comment('At the time of Payment Order Creations')->nullable();
            $table->userTracking();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_usages');
    }
};
