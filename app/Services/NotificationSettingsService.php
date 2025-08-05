<?php

namespace App\Services;

use App\Models\User;
use App\Models\NotificationType;
use App\Models\NotificationChannel;
use App\Models\UserNotificationSetting;

class NotificationSettingsService
{
    public function setupDefaultSettingsForUser(User $user)
    {
        // Delete any existing settings to prevent duplicates
        UserNotificationSetting::where('user_id', $user->id)->delete();

        $notificationTypes = NotificationType::all();
        $channels = NotificationChannel::all();

        // Default configuration for process flow notifications
        $defaultSettings = [
            'material_request' => ['email' => true, 'system' => true, 'sms' => false],
            'rfq_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'purchase_order_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'maharat_invoice_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'payment_order_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'budget_request_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'total_budget_approval' => ['email' => true, 'system' => true, 'sms' => false],
        ];

        $settings = [];

        foreach ($notificationTypes as $type) {
            foreach ($channels as $channel) {
                $isEnabled = $defaultSettings[$type->key][$channel->key] ?? false;

                $settings[] = [
                    'user_id' => $user->id,
                    'notification_type_id' => $type->id,
                    'notification_channel_id' => $channel->id,
                    'is_enabled' => $isEnabled,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Bulk insert for better performance
        if (!empty($settings)) {
            UserNotificationSetting::insert($settings);
        }

        return $settings;
    }
}
