<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Delete all existing user notification settings since they reference old notification types
        DB::table('user_notification_settings')->delete();
        
        // Get all users
        $users = DB::table('users')->get();
        
        // Get new notification types and channels
        $notificationTypes = DB::table('notification_types')->get();
        $notificationChannels = DB::table('notification_channels')->get();
        
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
        
        foreach ($users as $user) {
            foreach ($notificationTypes as $type) {
                foreach ($notificationChannels as $channel) {
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
        }
        
        // Bulk insert for better performance
        if (!empty($settings)) {
            DB::table('user_notification_settings')->insert($settings);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration fixes data, so the down method doesn't need to do anything
        // The previous migration will handle reverting the notification types
    }
};
