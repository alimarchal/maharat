<?php

namespace Database\Seeders;

use App\Models\NotificationChannel;
use Illuminate\Database\Seeder;

class NotificationChannelsSeeder extends Seeder
{
    public function run(): void
    {
        $channels = [
            ['name' => 'System', 'key' => 'system', 'description' => 'In-app notifications'],
            ['name' => 'Email', 'key' => 'email', 'description' => 'Email notifications'],
            ['name' => 'SMS', 'key' => 'sms', 'description' => 'SMS notifications'],
        ];

        foreach ($channels as $channel) {
            NotificationChannel::firstOrCreate(
                ['key' => $channel['key']],
                $channel
            );
        }
    }
}
