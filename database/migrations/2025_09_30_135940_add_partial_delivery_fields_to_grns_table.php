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
        if (!Schema::hasColumn('grns', 'expected_quantity')) {
            Schema::table('grns', function (Blueprint $table) {
                $table->decimal('expected_quantity', 15, 2)->nullable()->comment('Expected quantity from purchase order')->after('quantity');
            });
        }
        
        if (!Schema::hasColumn('grns', 'delivery_status')) {
            Schema::table('grns', function (Blueprint $table) {
                $table->enum('delivery_status', ['complete', 'partial', 'awaiting_remaining'])->default('complete')->comment('Delivery status: complete, partial, awaiting_remaining')->after('expected_quantity');
            });
        }
        
        if (!Schema::hasColumn('grns', 'delivery_notes')) {
            Schema::table('grns', function (Blueprint $table) {
                $table->text('delivery_notes')->nullable()->comment('Notes about partial delivery')->after('delivery_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grns', function (Blueprint $table) {
            $table->dropColumn(['expected_quantity', 'delivery_status', 'delivery_notes']);
        });
    }
};
