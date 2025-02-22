<?php

namespace Database\Seeders;

use App\Models\Rfq;
use App\Models\RfqItem;
use Illuminate\Database\Seeder;

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
                    'unit' => ['PCS', 'SET', 'UNIT'][rand(0, 2)],
                    'quantity' => rand(1, 10),
                    'brand' => ['Samsung', 'HP', 'Dell', 'Generic'][rand(0, 3)],
                    'expected_delivery_date' => now()->addDays(rand(7, 30)),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }
}
