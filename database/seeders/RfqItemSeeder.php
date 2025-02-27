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
        $items = [
            ['name' => 'Office Chair', 'description' => 'Ergonomic office chair with adjustable height'],
            ['name' => 'Desk', 'description' => 'Standard office desk 150x75cm'],
            ['name' => 'Filing Cabinet', 'description' => '4-drawer metal filing cabinet'],
            ['name' => 'Laptop', 'description' => 'Business laptop with 16GB RAM'],
            ['name' => 'Monitor', 'description' => '27-inch LED monitor']
        ];

        foreach ($rfqs as $rfq) {
            $numberOfItems = rand(2, 4);
            
            for ($i = 0; $i < $numberOfItems; $i++) {
                $item = $items[array_rand($items)];
                RfqItem::create([
                    'rfq_id' => $rfq->id,
                    'item_name' => $item['name'],
                    'description' => $item['description'],
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
