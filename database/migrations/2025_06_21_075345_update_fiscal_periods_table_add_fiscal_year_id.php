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
        // 1. Add fiscal_year_id as nullable for now
        Schema::table('fiscal_periods', function (Blueprint $table) {
            $table->unsignedBigInteger('fiscal_year_id')->nullable()->after('id');
        });

        // 2. For each unique year in fiscal_periods, create a fiscal_years record if not exists
        $years = DB::table('fiscal_periods')
            ->select(DB::raw('YEAR(fiscal_year) as year'))
            ->distinct()
            ->pluck('year')
            ->filter();

        foreach ($years as $year) {
            $exists = DB::table('fiscal_years')->where('fiscal_year', $year)->exists();
            if (!$exists) {
                DB::table('fiscal_years')->insert([
                    'fiscal_year' => $year,
                    'name' => "Budget $year",
                    'start_date' => "$year-01-01",
                    'end_date' => "$year-12-31",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Update each fiscal_period to set fiscal_year_id
        $fiscalYears = DB::table('fiscal_years')->get();
        foreach ($fiscalYears as $fy) {
            DB::table('fiscal_periods')
                ->whereYear('fiscal_year', $fy->fiscal_year)
                ->update(['fiscal_year_id' => $fy->id]);
        }

        // 4. Make fiscal_year_id non-nullable and add foreign key
        Schema::table('fiscal_periods', function (Blueprint $table) {
            $table->unsignedBigInteger('fiscal_year_id')->nullable(false)->change();
            $table->foreign('fiscal_year_id')->references('id')->on('fiscal_years')->onDelete('cascade');
        });

        // 5. Drop old columns
        Schema::table('fiscal_periods', function (Blueprint $table) {
            $table->dropColumn('fiscal_year');
            $table->dropColumn('period_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_periods', function (Blueprint $table) {
            $table->dropForeign(['fiscal_year_id']);
            $table->dropColumn('fiscal_year_id');
            $table->integer('fiscal_year')->nullable();
            $table->integer('period_number')->nullable();
        });
    }
};
