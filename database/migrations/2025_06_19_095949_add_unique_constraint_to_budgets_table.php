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
        // First, clean up existing duplicates by keeping only the latest record for each unique combination
        $duplicates = DB::table('budgets')
            ->select('fiscal_period_id', 'cost_center_id', 'sub_cost_center_id', DB::raw('COUNT(*) as count'))
            ->groupBy('fiscal_period_id', 'cost_center_id', 'sub_cost_center_id')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            $recordsToDelete = DB::table('budgets')
                ->where('fiscal_period_id', $duplicate->fiscal_period_id)
                ->where('cost_center_id', $duplicate->cost_center_id)
                ->where('sub_cost_center_id', $duplicate->sub_cost_center_id)
                ->orderBy('created_at', 'desc')
                ->skip(1) // Keep the latest record
                ->get();

            foreach ($recordsToDelete as $record) {
                DB::table('budgets')->where('id', $record->id)->delete();
            }
        }

        // Add unique constraint
        Schema::table('budgets', function (Blueprint $table) {
            $table->unique(['fiscal_period_id', 'cost_center_id', 'sub_cost_center_id'], 'budgets_unique_fiscal_cost_sub_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropUnique('budgets_unique_fiscal_cost_sub_cost');
        });
    }
};
