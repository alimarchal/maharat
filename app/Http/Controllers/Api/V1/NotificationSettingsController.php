<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserNotificationSetting;
use App\Services\NotificationSettingsService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NotificationSettingsController extends Controller
{
    protected $notificationSettingsService;

    public function __construct(NotificationSettingsService $notificationSettingsService)
    {
        $this->notificationSettingsService = $notificationSettingsService;
    }

    /**
     * Initialize default notification settings for a user
     *
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function setupDefaults(User $user)
    {
        $this->notificationSettingsService->setupDefaultSettingsForUser($user);

        return response()->json([
            'message' => 'Default notification settings initialized successfully',
            'user_id' => $user->id
        ], Response::HTTP_OK);
    }

    /**
     * Get user's notification settings
     *
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserSettings(User $user)
    {
        $settings = $user->notificationSettings()
            ->with(['notificationType', 'notificationChannel'])
            ->get()
            ->groupBy('notificationType.key')
            ->map(function ($typeGroup) {
                return $typeGroup->mapWithKeys(function ($item) {
                    return [$item->notificationChannel->key => $item->is_enabled];
                });
            });

        return response()->json([
            'user_id' => $user->id,
            'settings' => $settings
        ], Response::HTTP_OK);
    }

    /**
     * Update user's notification settings
     *
     * @param Request $request
     * @param User $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSettings(Request $request, User $user)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.type_id' => 'required|exists:notification_types,id',
            'settings.*.channel_id' => 'required|exists:notification_channels,id',
            'settings.*.enabled' => 'required|boolean',
        ]);

        foreach ($validated['settings'] as $setting) {
            UserNotificationSetting::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_type_id' => $setting['type_id'],
                    'notification_channel_id' => $setting['channel_id'],
                ],
                ['is_enabled' => $setting['enabled']]
            );
        }

        return response()->json([
            'message' => 'Notification settings updated successfully',
            'user_id' => $user->id
        ], Response::HTTP_OK);
    }
}
