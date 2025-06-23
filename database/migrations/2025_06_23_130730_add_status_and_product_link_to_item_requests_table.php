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
            $table->foreignId('status_id')->nullable()->constrained('statuses')->default(1); // 1 = Pending
            $table->foreignId('approved_by')->nullable()->constrained('users'); // Who approved it
            $table->foreignId('product_id')->nullable()->constrained('products'); // Link to created product
            $table->timestamp('approved_at')->nullable(); // When it was approved
            $table->text('rejection_reason')->nullable(); // If rejected
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
