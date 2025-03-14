<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\GeneralNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {

        $userId = $request->user_id ?? Auth::id();

        $user = User::findOrFail($userId);

        // Get notifications with optional filtering
        $query = $user->notifications();


        // Filter by read/unread status
        if ($request->has('read')) {
            if ($request->boolean('read')) {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        // Filter by type
        if ($request->has('type')) {
            $query->whereJsonContains('data->type', $request->type);
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sortField = $request->sort;
            $direction = 'asc';

            if (strpos($sortField, '-') === 0) {
                $direction = 'desc';
                $sortField = substr($sortField, 1);
            }

            // For created_at/updated_at, sort directly on the field
            if (in_array($sortField, ['created_at', 'updated_at'])) {
                $query->orderBy($sortField, $direction);
            }
            // For other fields stored in the data JSON column
            else {
                $query->orderBy("data->{$sortField}", $direction);
            }
        } else {
            // Default sorting by latest first
            $query->latest();
        }

        // Paginate results
        $perPage = $request->per_page ?? 15;
        $notifications = $query->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Store a newly created notification in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validate the request
        $request->validate([
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|max:50',
            'data' => 'nullable|array'
        ]);

        // Prepare notification data
        $notificationData = [
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type,
            'additional_data' => $request->data ?? [],
            'created_by' => Auth::id() ?? null,
            'created_at' => now()->toDateTimeString()
        ];

        // If user_ids is not provided, default to the authenticated user
        if (!$request->has('user_ids') || empty($request->user_ids)) {
            $users = collect([Auth::user()]);
        } else {
            $users = User::whereIn('id', $request->user_ids)->get();
        }

        Notification::send($users, new GeneralNotification($notificationData));

        return response()->json([
            'status' => 'success',
            'message' => 'Notifications sent successfully',
            'recipients_count' => $users->count()
        ], 201);
    }

    /**
     * Display notifications for a specific user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function userNotifications(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Get notifications with optional filtering
        $query = $user->notifications();

        // Filter by read/unread status
        if ($request->has('read')) {
            if ($request->boolean('read')) {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        // Filter by type
        if ($request->has('type')) {
            $query->whereJsonContains('data->type', $request->type);
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sortField = $request->sort;
            $direction = 'asc';

            if (strpos($sortField, '-') === 0) {
                $direction = 'desc';
                $sortField = substr($sortField, 1);
            }

            // Handle different field types
            if (in_array($sortField, ['created_at', 'updated_at'])) {
                $query->orderBy($sortField, $direction);
            } else {
                $query->orderBy("data->{$sortField}", $direction);
            }
        } else {
            // Default sorting by latest first
            $query->latest();
        }

        // Paginate results
        $perPage = $request->per_page ?? 15;
        $notifications = $query->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Mark a specific notification as read.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request, $id)
    {
        // Get user ID from request or authenticated user
        $userId = $request->user_id ?? Auth::id();

        // Find the notification directly with both the notification ID and user ID constraints
        $notification = \Illuminate\Notifications\DatabaseNotification::where('id', $id)
            ->where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $userId)
            ->first();

        // Check if notification exists
        if (!$notification) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found for this user'
            ], 404);
        }

        // Mark as read
        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
    }


    /**
     * Display unread notifications for a specific user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function userUnreadNotifications(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Get only unread notifications
        $query = $user->unreadNotifications();

        // Filter by type
        if ($request->has('type')) {
            $query->whereJsonContains('data->type', $request->type);
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sortField = $request->sort;
            $direction = 'asc';

            if (strpos($sortField, '-') === 0) {
                $direction = 'desc';
                $sortField = substr($sortField, 1);
            }

            // Handle different field types
            if (in_array($sortField, ['created_at', 'updated_at'])) {
                $query->orderBy($sortField, $direction);
            } else {
                $query->orderBy("data->{$sortField}", $direction);
            }
        } else {
            // Default sorting by latest first
            $query->latest();
        }

        // Paginate results
        $perPage = $request->per_page ?? 15;
        $notifications = $query->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Mark all notifications as read for a specific user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user_id ?? Auth::id();
        $user = User::findOrFail($userId);

        $user->unreadNotifications->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read'
        ]);
    }



}
