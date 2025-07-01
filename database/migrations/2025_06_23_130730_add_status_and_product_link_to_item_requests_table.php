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
        Schema::table('item_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('item_requests', 'status_id')) {
                $table->foreignId('status_id')->nullable()->constrained('statuses')->default(1); // 1 = Pending
            }
            if (!Schema::hasColumn('item_requests', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users'); // Who approved it
            }
            if (!Schema::hasColumn('item_requests', 'product_id')) {
                $table->foreignId('product_id')->nullable()->constrained('products'); // Link to created product
            }
            if (!Schema::hasColumn('item_requests', 'approved_at')) {
                $table->timestamp('approved_at')->nullable(); // When it was approved
            }
            if (!Schema::hasColumn('item_requests', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable(); // If rejected
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_requests', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['product_id']);
            $table->dropColumn(['status_id', 'approved_by', 'product_id', 'approved_at', 'rejection_reason']);
        });
    }
};
