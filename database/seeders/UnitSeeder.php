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
        DB::table('units')->delete();

        $units = [
            // Weight/Mass Units
            [
                'name' => 'Kilogram',
                'short_title' => 'kg',
            ],
            [
                'name' => 'Gram',
                'short_title' => 'g',
            ],
            [
                'name' => 'Milligram',
                'short_title' => 'mg',
            ],
            [
                'name' => 'Metric Ton',
                'short_title' => 'MT',
            ],
            [
                'name' => 'Pound',
                'short_title' => 'lb',
            ],
            [
                'name' => 'Ounce',
                'short_title' => 'oz',
            ],

            // Volume Units
            [
                'name' => 'Liter',
                'short_title' => 'L',
            ],
            [
                'name' => 'Milliliter',
                'short_title' => 'ml',
            ],
            [
                'name' => 'Cubic Meter',
                'short_title' => 'm³',
            ],
            [
                'name' => 'Gallon',
                'short_title' => 'gal',
            ],
            [
                'name' => 'Quart',
                'short_title' => 'qt',
            ],
            [
                'name' => 'Pint',
                'short_title' => 'pt',
            ],
            [
                'name' => 'Fluid Ounce',
                'short_title' => 'fl oz',
            ],

            // Length Units
            [
                'name' => 'Meter',
                'short_title' => 'm',
            ],
            [
                'name' => 'Centimeter',
                'short_title' => 'cm',
            ],
            [
                'name' => 'Millimeter',
                'short_title' => 'mm',
            ],
            [
                'name' => 'Kilometer',
                'short_title' => 'km',
            ],
            [
                'name' => 'Inch',
                'short_title' => 'in',
            ],
            [
                'name' => 'Foot',
                'short_title' => 'ft',
            ],
            [
                'name' => 'Yard',
                'short_title' => 'yd',
            ],
            [
                'name' => 'Mile',
                'short_title' => 'mi',
            ],

            // Area Units
            [
                'name' => 'Square Meter',
                'short_title' => 'm²',
            ],
            [
                'name' => 'Square Foot',
                'short_title' => 'ft²',
            ],
            [
                'name' => 'Square Inch',
                'short_title' => 'in²',
            ],
            [
                'name' => 'Square Yard',
                'short_title' => 'yd²',
            ],
            [
                'name' => 'Hectare',
                'short_title' => 'ha',
            ],
            [
                'name' => 'Acre',
                'short_title' => 'ac',
            ],

            // Time Units
            [
                'name' => 'Second',
                'short_title' => 'sec',
            ],
            [
                'name' => 'Minute',
                'short_title' => 'min',
            ],
            [
                'name' => 'Hour',
                'short_title' => 'hr',
            ],
            [
                'name' => 'Day',
                'short_title' => 'day',
            ],
            [
                'name' => 'Week',
                'short_title' => 'wk',
            ],
            [
                'name' => 'Month',
                'short_title' => 'mo',
            ],
            [
                'name' => 'Year',
                'short_title' => 'yr',
            ],

            // Temperature Units
            [
                'name' => 'Celsius',
                'short_title' => '°C',
            ],
            [
                'name' => 'Fahrenheit',
                'short_title' => '°F',
            ],
            [
                'name' => 'Kelvin',
                'short_title' => 'K',
            ],

            // Energy Units
            [
                'name' => 'Joule',
                'short_title' => 'J',
            ],
            [
                'name' => 'Calorie',
                'short_title' => 'cal',
            ],
            [
                'name' => 'Kilowatt Hour',
                'short_title' => 'kWh',
            ],
            [
                'name' => 'British Thermal Unit',
                'short_title' => 'BTU',
            ],

            // Power Units
            [
                'name' => 'Watt',
                'short_title' => 'W',
            ],
            [
                'name' => 'Kilowatt',
                'short_title' => 'kW',
            ],
            [
                'name' => 'Horsepower',
                'short_title' => 'hp',
            ],

            // Pressure Units
            [
                'name' => 'Pascal',
                'short_title' => 'Pa',
            ],
            [
                'name' => 'Kilopascal',
                'short_title' => 'kPa',
            ],
            [
                'name' => 'Bar',
                'short_title' => 'bar',
            ],
            [
                'name' => 'Pounds per Square Inch',
                'short_title' => 'psi',
            ],

            // Speed Units
            [
                'name' => 'Meters per Second',
                'short_title' => 'm/s',
            ],
            [
                'name' => 'Kilometers per Hour',
                'short_title' => 'km/h',
            ],
            [
                'name' => 'Miles per Hour',
                'short_title' => 'mph',
            ],
            [
                'name' => 'Knot',
                'short_title' => 'kn',
            ],

            // Data Units
            [
                'name' => 'Byte',
                'short_title' => 'B',
            ],
            [
                'name' => 'Kilobyte',
                'short_title' => 'KB',
            ],
            [
                'name' => 'Megabyte',
                'short_title' => 'MB',
            ],
            [
                'name' => 'Gigabyte',
                'short_title' => 'GB',
            ],
            [
                'name' => 'Terabyte',
                'short_title' => 'TB',
            ],

            // Frequency Units
            [
                'name' => 'Hertz',
                'short_title' => 'Hz',
            ],
            [
                'name' => 'Kilohertz',
                'short_title' => 'kHz',
            ],
            [
                'name' => 'Megahertz',
                'short_title' => 'MHz',
            ],
            [
                'name' => 'Gigahertz',
                'short_title' => 'GHz',
            ],

            // Quantity Units
            [
                'name' => 'Piece',
                'short_title' => 'pc',
            ],
            [
                'name' => 'Pair',
                'short_title' => 'pr',
            ],
            [
                'name' => 'Dozen',
                'short_title' => 'dz',
            ],
            [
                'name' => 'Set',
                'short_title' => 'set',
            ],
            [
                'name' => 'Pack',
                'short_title' => 'pk',
            ],
            [
                'name' => 'Box',
                'short_title' => 'box',
            ],
            [
                'name' => 'Carton',
                'short_title' => 'ctn',
            ],
            [
                'name' => 'Case',
                'short_title' => 'case',
            ],
            [
                'name' => 'Pallet',
                'short_title' => 'plt',
            ],
            [
                'name' => 'Roll',
                'short_title' => 'roll',
            ],
            [
                'name' => 'Sheet',
                'short_title' => 'sht',
            ],
            [
                'name' => 'Unit',
                'short_title' => 'unit',
            ],
            [
                'name' => 'Each',
                'short_title' => 'ea',
            ],
            [
                'name' => 'Lot',
                'short_title' => 'lot',
            ],
            [
                'name' => 'Batch',
                'short_title' => 'batch',
            ],

            // Currency Units
            [
                'name' => 'US Dollar',
                'short_title' => 'USD',
            ],
            [
                'name' => 'Euro',
                'short_title' => 'EUR',
            ],
            [
                'name' => 'British Pound',
                'short_title' => 'GBP',
            ],

            // Concentration Units
            [
                'name' => 'Percent',
                'short_title' => '%',
            ],
            [
                'name' => 'Parts Per Million',
                'short_title' => 'ppm',
            ],
            [
                'name' => 'Milligram per Liter',
                'short_title' => 'mg/L',
            ],
        ];

        foreach ($units as $unit) {
            Unit::create($unit);
        }
    }
}
