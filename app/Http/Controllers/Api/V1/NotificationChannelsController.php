<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NotificationChannel;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NotificationChannelsController extends Controller
{
    /**
     * Display a listing of notification channels.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $channels = NotificationChannel::all();

        return response()->json([
            'data' => $channels
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created notification channel.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:255|unique:notification_channels',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $channel = NotificationChannel::create($validated);

        return response()->json([
            'message' => 'Notification channel created successfully',
            'data' => $channel
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified notification channel.
     *
     * @param  \App\Models\NotificationChannel  $notificationChannel
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(NotificationChannel $notificationChannel)
    {
        return response()->json([
            'data' => $notificationChannel
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified notification channel.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\NotificationChannel  $notificationChannel
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, NotificationChannel $notificationChannel)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'key' => 'string|max:255|unique:notification_channels,key,' . $notificationChannel->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $notificationChannel->update($validated);

        return response()->json([
            'message' => 'Notification channel updated successfully',
            'data' => $notificationChannel
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified notification channel.
     *
     * @param  \App\Models\NotificationChannel  $notificationChannel
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(NotificationChannel $notificationChannel)
    {
        $notificationChannel->delete();

        return response()->json([
            'message' => 'Notification channel deleted successfully'
        ], Response::HTTP_OK);
    }
}
