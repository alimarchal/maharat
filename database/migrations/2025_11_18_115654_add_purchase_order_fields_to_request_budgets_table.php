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
        Schema::table('request_budgets', function (Blueprint $table) {
            $table->foreignId('purchase_order_id')->nullable()->after('id')->constrained('purchase_orders', 'id')->onDelete('cascade');
            $table->boolean('sub_cost_center_updated')->default(false)->after('reallocate_to_sub_cost_center')->comment('Whether destination sub cost center was updated during approval');
            $table->foreignId('original_destination_sub_cost_center')->nullable()->after('sub_cost_center_updated')->constrained('cost_centers', 'id')->onDelete('set null')->comment('Original destination sub cost center when reallocation was created');
            $table->foreignId('updated_destination_sub_cost_center')->nullable()->after('original_destination_sub_cost_center')->constrained('cost_centers', 'id')->onDelete('set null')->comment('Updated destination sub cost center if changed during approval');
            $table->foreignId('updated_by_user_id')->nullable()->after('updated_destination_sub_cost_center')->constrained('users', 'id')->onDelete('set null')->comment('User who updated the destination sub cost center');
            $table->json('available_alternatives_json')->nullable()->after('updated_by_user_id')->comment('JSON array of alternative sub cost centers available when PO was created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_budgets', function (Blueprint $table) {
            $table->dropForeign(['purchase_order_id']);
            $table->dropForeign(['original_destination_sub_cost_center']);
            $table->dropForeign(['updated_destination_sub_cost_center']);
            $table->dropForeign(['updated_by_user_id']);
            $table->dropColumn([
                'purchase_order_id',
                'sub_cost_center_updated',
                'original_destination_sub_cost_center',
                'updated_destination_sub_cost_center',
                'updated_by_user_id',
                'available_alternatives_json'
            ]);
        });
    }
};
