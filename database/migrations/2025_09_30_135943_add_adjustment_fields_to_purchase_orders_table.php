<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if columns don't already exist before adding them
        if (!Schema::hasColumn('purchase_orders', 'adjust_amount')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->decimal('adjust_amount', 15, 2)->default(0)->comment('Adjustment amount for partial deliveries')->after('vat_amount');
            });
        }
        
        if (!Schema::hasColumn('purchase_orders', 'total_amount')) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->decimal('total_amount', 15, 2)->nullable()->comment('Total amount after adjustments (amount + vat - adjust_amount)')->after('adjust_amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['adjust_amount', 'total_amount']);
        });
    }
};
