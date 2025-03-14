<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Find a fallback unit ID (or create one if not exists)
            $fallbackUnit = Unit::firstOrCreate(
                ['id' => 1], 
                ['name' => 'Pieces', 'short_title' => 'PCs']
            );

            // Update products to use the fallback unit instead of deleting all units
            DB::table('products')->update(['unit_id' => $fallbackUnit->id]);

        $units = [
            ['id' => 1, 'name' => 'Pieces', 'short_title' => 'PCs'],
            ['id' => 2, 'name' => 'Kilogram', 'short_title' => 'kg'],
            ['id' => 3, 'name' => 'Gram', 'short_title' => 'g'],
            ['id' => 4, 'name' => 'Milligram', 'short_title' => 'mg'],
            ['id' => 5, 'name' => 'Metric Ton', 'short_title' => 'MT'],
            ['id' => 6, 'name' => 'Pound', 'short_title' => 'lb'],
            ['id' => 7, 'name' => 'Ounce', 'short_title' => 'oz'],
            ['id' => 8, 'name' => 'Liter', 'short_title' => 'L'],
            ['id' => 9, 'name' => 'Milliliter', 'short_title' => 'ml'],
            ['id' => 10, 'name' => 'Cubic Meter', 'short_title' => 'm³'],
            ['id' => 11, 'name' => 'Gallon', 'short_title' => 'gal'],
            ['id' => 12, 'name' => 'Quart', 'short_title' => 'qt'],
            ['id' => 13, 'name' => 'Pint', 'short_title' => 'pt'],
            ['id' => 14, 'name' => 'Fluid Ounce', 'short_title' => 'fl oz'],
            ['id' => 15, 'name' => 'Meter', 'short_title' => 'm'],
            ['id' => 16, 'name' => 'Centimeter', 'short_title' => 'cm'],
            ['id' => 17, 'name' => 'Millimeter', 'short_title' => 'mm'],
            ['id' => 18, 'name' => 'Kilometer', 'short_title' => 'km'],
            ['id' => 19, 'name' => 'Inch', 'short_title' => 'in'],
            ['id' => 20, 'name' => 'Foot', 'short_title' => 'ft'],
            ['id' => 21, 'name' => 'Yard', 'short_title' => 'yd'],
            ['id' => 22, 'name' => 'Mile', 'short_title' => 'mi'],
            ['id' => 23, 'name' => 'Square Meter', 'short_title' => 'm²'],
            ['id' => 24, 'name' => 'Square Foot', 'short_title' => 'ft²'],
            ['id' => 25, 'name' => 'Square Inch', 'short_title' => 'in²'],
            ['id' => 26, 'name' => 'Square Yard', 'short_title' => 'yd²'],
            ['id' => 27, 'name' => 'Hectare', 'short_title' => 'ha'],
            ['id' => 28, 'name' => 'Acre', 'short_title' => 'ac'],
            ['id' => 29, 'name' => 'Second', 'short_title' => 'sec'],
            ['id' => 30, 'name' => 'Minute', 'short_title' => 'min'],
            ['id' => 31, 'name' => 'Hour', 'short_title' => 'hr'],
            ['id' => 32, 'name' => 'Day', 'short_title' => 'day'],
            ['id' => 33, 'name' => 'Week', 'short_title' => 'wk'],
            ['id' => 34, 'name' => 'Month', 'short_title' => 'mo'],
            ['id' => 35, 'name' => 'Year', 'short_title' => 'yr'],
            ['id' => 36, 'name' => 'Celsius', 'short_title' => '°C'],
            ['id' => 37, 'name' => 'Fahrenheit', 'short_title' => '°F'],
            ['id' => 38, 'name' => 'Kelvin', 'short_title' => 'K'],
            ['id' => 39, 'name' => 'Joule', 'short_title' => 'J'],
            ['id' => 40, 'name' => 'Calorie', 'short_title' => 'cal'],
            ['id' => 41, 'name' => 'Kilowatt Hour', 'short_title' => 'kWh'],
            ['id' => 42, 'name' => 'Watt', 'short_title' => 'W'],
            ['id' => 43, 'name' => 'Kilowatt', 'short_title' => 'kW'],
            ['id' => 44, 'name' => 'Horsepower', 'short_title' => 'hp'],
            ['id' => 45, 'name' => 'Pascal', 'short_title' => 'Pa'],
            ['id' => 46, 'name' => 'Kilopascal', 'short_title' => 'kPa'],
            ['id' => 47, 'name' => 'Bar', 'short_title' => 'bar'],
            ['id' => 48, 'name' => 'Pounds per Square Inch', 'short_title' => 'psi'],
            ['id' => 49, 'name' => 'Meters per Second', 'short_title' => 'm/s'],
            ['id' => 50, 'name' => 'Kilometers per Hour', 'short_title' => 'km/h'],
            ['id' => 51, 'name' => 'Miles per Hour', 'short_title' => 'mph'],
            ['id' => 52, 'name' => 'Byte', 'short_title' => 'B'],
            ['id' => 53, 'name' => 'Kilobyte', 'short_title' => 'KB'],
            ['id' => 54, 'name' => 'Megabyte', 'short_title' => 'MB'],
            ['id' => 55, 'name' => 'Gigabyte', 'short_title' => 'GB'],
            ['id' => 56, 'name' => 'Terabyte', 'short_title' => 'TB'],
            ['id' => 57, 'name' => 'Piece', 'short_title' => 'pc'],
            ['id' => 58, 'name' => 'Pair', 'short_title' => 'pr'],
            ['id' => 59, 'name' => 'Dozen', 'short_title' => 'dz'],
            ['id' => 60, 'name' => 'Pack', 'short_title' => 'pk'],
            ['id' => 61, 'name' => 'Carton', 'short_title' => 'ctn'],
            ['id' => 62, 'name' => 'Box', 'short_title' => 'box'],
            ['id' => 63, 'name' => 'Pallet', 'short_title' => 'plt'],
            ['id' => 64, 'name' => 'Roll', 'short_title' => 'roll'],
            ['id' => 65, 'name' => 'Sheet', 'short_title' => 'sht'],
            ['id' => 66, 'name' => 'Unit', 'short_title' => 'unit'],
            ['id' => 67, 'name' => 'Lot', 'short_title' => 'lot'],
            ['id' => 68, 'name' => 'Batch', 'short_title' => 'batch'],
        ];

        Unit::upsert($units, ['id'], ['name', 'short_title']);

    });
    }
}
