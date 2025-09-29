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
        Schema::table('grns', function (Blueprint $table) {
            $table->enum('delivery_status', ['complete_delivery', 'later_delivery', 'adjust_order'])
                  ->default('complete_delivery')
                  ->after('delivery_date')
                  ->comment('Delivery completion status');
            
            $table->text('adjustment_notes')->nullable()
                  ->after('delivery_status')
                  ->comment('Notes for delivery adjustments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grns', function (Blueprint $table) {
            $table->dropColumn(['delivery_status', 'adjustment_notes']);
        });
    }
};
