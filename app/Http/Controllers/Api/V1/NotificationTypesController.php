<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NotificationType;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NotificationTypesController extends Controller
{
    /**
     * Display a listing of notification types.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $types = NotificationType::all();

        return response()->json([
            'data' => $types
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created notification type.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:255|unique:notification_types',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $type = NotificationType::create($validated);

        return response()->json([
            'message' => 'Notification type created successfully',
            'data' => $type
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified notification type.
     *
     * @param  \App\Models\NotificationType  $notificationType
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(NotificationType $notificationType)
    {
        return response()->json([
            'data' => $notificationType
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified notification type.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\NotificationType  $notificationType
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, NotificationType $notificationType)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'key' => 'string|max:255|unique:notification_types,key,' . $notificationType->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $notificationType->update($validated);

        return response()->json([
            'message' => 'Notification type updated successfully',
            'data' => $notificationType
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified notification type.
     *
     * @param  \App\Models\NotificationType  $notificationType
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(NotificationType $notificationType)
    {
        $notificationType->delete();

        return response()->json([
            'message' => 'Notification type deleted successfully'
        ], Response::HTTP_OK);
    }
}
