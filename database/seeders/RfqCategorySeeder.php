<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\Rfq;
use App\Models\ProductCategory;

class RfqCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if tables exist
        if (!Schema::hasTable('rfq_categories') || !Schema::hasTable('rfqs') || !Schema::hasTable('product_categories')) {
            $this->command->warn('Required tables do not exist. Skipping RfqCategorySeeder.');
            return;
        }

        DB::beginTransaction(); // Start transaction

        try {
            // Fetch RFQs and categories dynamically
            try {
                $rfqs = Rfq::pluck('id')->toArray();
                $categories = ProductCategory::pluck('id')->toArray();
            } catch (\Exception $e) {
                $this->command->warn('Unable to load models. Using fixed IDs instead.');
                // Create fallback data if models can't be loaded
                $rfqs = range(1, 4);
                $categories = range(1, 10);
            }

            // Ensure RFQs and Categories exist
            if (empty($rfqs) || empty($categories)) {
                $this->command->warn("No RFQs or Categories found. Please seed RFQs and Product Categories first.");
                DB::rollBack();
                return;
            }

            // Delete only the records that are about to be inserted (safer than truncate)
            DB::table('rfq_categories')->whereIn('rfq_id', array_slice($rfqs, 0, 4))->delete();

            // Generate RFQ-Category mappings dynamically
            $rfqCategories = [];
            for ($i = 0; $i < min(4, count($rfqs)); $i++) {
                $rfqCategories[] = [
                    'rfq_id' => $rfqs[$i],
                    'category_id' => $categories[$i % count($categories)], // Cycle through available categories
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ];
            }

            // Insert into database
            DB::table('rfq_categories')->insert($rfqCategories);

            DB::commit(); // Commit transaction
            $this->command->info("RFQ Categories seeded successfully.");

        } catch (\Exception $e) {
            DB::rollBack(); // Rollback if error occurs
            $this->command->error("Error seeding RFQ Categories: " . $e->getMessage());
        }
    }
}