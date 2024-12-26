<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Currency>
 */
class CurrencyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->currencyCode(),
            'name' => $this->faker->unique()->currency(),
            'fraction_name' => $this->faker->randomElement(['Cent', 'Penny', 'Piastre', 'Fils', 'Halala']),
            'rate' => $this->faker->randomFloat(6, 0.1, 100),
            'last_updated_at' => $this->faker->dateTimeThisYear(),
            'created_by' => null,
            'updated_by' => null,
        ];
    }
}
