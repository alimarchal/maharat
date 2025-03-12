<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //    "name": "Dubai Main Warehouse",
        //    "code": "DXB009",
        //    "address": "Dubai Industrial City",
        //    "latitude": "25.0657",
        //    "longitude": "55.1713"


        DB::table('warehouses')->delete();
        $w = [
            // Weight/Mass Units
            [
                'name' => 'Dubai Main Warehouse',
                'code' => 'DXB009',
                'address' => 'Dubai Industrial City',
            ],
        ];

        foreach ($w as $wh) {
            Warehouse::create($wh);
        }
    }
}
