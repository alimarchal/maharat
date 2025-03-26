<?php

namespace Database\Seeders;

use App\Models\Rfq;
use App\Models\RfqItem;
use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\Unit;

class RfqItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rfqs = Rfq::all();

        foreach ($rfqs as $rfq) {
            $numberOfItems = rand(2, 4);

            for ($i = 0; $i < $numberOfItems; $i++) {
                RfqItem::create([
                    'rfq_id' => $rfq->id,
                    'product_id' => rand(201, 203),
                    'unit_id' => Unit::inRandomOrder()->first()->id ?? 1,
                    'quantity' => rand(1, 10),
                    'brand_id' => Brand::inRandomOrder()->first()->id ?? 1,
                    'expected_delivery_date' => now()->addDays(rand(7, 30)),
                    'status_id' => 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

}
