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

        // Default configuration
        $defaultSettings = [
            'rfq_document' => ['email' => true, 'system' => false, 'sms' => false],
            'quotations_document' => ['email' => false, 'system' => true, 'sms' => true],
            'goods_receiving_notes' => ['email' => false, 'system' => true, 'sms' => false],
            'mrs_documents' => ['email' => true, 'system' => false, 'sms' => false],
            'invoices_documents' => ['email' => false, 'system' => false, 'sms' => false],
            'pmntos_documents' => ['email' => false, 'system' => false, 'sms' => false],
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
