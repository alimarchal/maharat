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
            $table->decimal('old_balance', 15, 2)->nullable()->after('balance_amount')->comment('Original balance before reallocation');
            $table->decimal('reallocate_amount', 15, 2)->nullable()->after('old_balance')->comment('Amount being reallocated');
            $table->foreignId('reallocate_to_sub_cost_center')->nullable()->after('reallocate_amount')->constrained('cost_centers', 'id')->comment('Destination sub cost center for reallocation');
            $table->decimal('destination_old_balance', 15, 2)->nullable()->after('reallocate_to_sub_cost_center')->comment('Destination sub cost center old balance before reallocation');
            $table->enum('type', ['budget_request', 'reallocation'])->default('budget_request')->after('destination_old_balance')->comment('Type of request: budget_request or reallocation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('request_budgets', function (Blueprint $table) {
            $table->dropForeign(['reallocate_to_sub_cost_center']);
            $table->dropColumn([
                'old_balance',
                'reallocate_amount',
                'reallocate_to_sub_cost_center',
                'destination_old_balance',
                'type'
            ]);
        });
    }
};
