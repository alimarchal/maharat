<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sms>
 */
class SmsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'template_name' => $this->faker->words(3, true),
            'template_code' => $this->faker->unique()->bothify('SMS_???###'),
            'content' => $this->faker->paragraph(),
            'type' => $this->faker->randomElement(['transactional', 'promotional', 'otp']),
            'placeholders' => ['name', 'amount', 'date'],
            'sender_id' => $this->faker->bothify('SENDER##'),
            'status' => $this->faker->randomElement(['draft', 'active', 'inactive']),
            'retry_attempts' => $this->faker->numberBetween(1, 5),
            'validity_period' => $this->faker->numberBetween(5, 60),
        ];
    }
}
