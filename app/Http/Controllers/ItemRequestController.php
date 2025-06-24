<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ItemRequest;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Http\Resources\V1\ItemRequestResource;


class ItemRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ItemRequest::with(['user', 'product'])->latest();

        // Apply filters if provided
        if ($request->has('filter')) {
            $filters = $request->input('filter');
            
            // Filter by user_id if provided
            if (isset($filters['user_id'])) {
                $query->where('user_id', $filters['user_id']);
            } else {
                // Default to current user if no user_id filter
                $query->where('user_id', Auth::id());
            }
            
            // Filter by status if provided
            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }
            
            // Filter by is_requested if provided
            if (isset($filters['is_requested'])) {
                $query->where('is_requested', $filters['is_requested']);
            }
            
            // Filter by is_added for backward compatibility
            if (isset($filters['is_added'])) {
                if ($filters['is_added']) {
                    // If is_added is true, get approved items
                    $query->where('status', 'Approved');
                } else {
                    // If is_added is false, get pending items
                    $query->where('status', 'Pending');
                }
            }
        } else {
            // Default behavior: show only current user's items
            $query->where('user_id', Auth::id());
        }

        $itemRequests = $query->paginate(10);

        return response()->json([
            'data' => $itemRequests
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return response()->json([
            'message' => 'Ready to create new request'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string',
                'quantity' => 'required|integer',
                'photo' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:2048',
                'description' => 'required|string',
                'is_added' => 'boolean'
            ]);

            // Handle photo upload
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                if ($file->isValid()) {
                    // Store the file and get the relative path
                    $path = $file->store('item-requests', 'public');
                    // Clean the path to remove any full URL
                    $path = str_replace('public/', '', $path);
                    $validated['photo'] = $path;
                } else {
                    return response()->json([
                        'message' => 'Invalid file upload',
                        'error' => 'The uploaded file is not valid'
                    ], 422);
                }
            }

            // Add user_id and ensure is_added is boolean
            $validated['user_id'] = Auth::id();
            $validated['is_added'] = $request->has('is_added') ? (bool) $request->is_added : false;

            $itemRequest = ItemRequest::create($validated);
            $itemRequest->load('user');

            return response()->json([
                'message' => 'Item request created successfully',
                'data' => new ItemRequestResource($itemRequest),
                'should_reload' => true
            ]);

        } catch (\Exception $e) {
            // Delete uploaded file if there was an error
            if (isset($path)) {
                Storage::disk('public')->delete($path);
            }

            return response()->json([
                'message' => 'Failed to create item request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $itemRequest = ItemRequest::where('user_id', Auth::id())
            ->with('user')
            ->findOrFail($id);

        return response()->json([
            'data' => new ItemRequestResource($itemRequest)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        return view('request-item.edit', compact('itemRequest'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $itemRequest = ItemRequest::where('user_id', Auth::id())
                ->findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string',
                'quantity' => 'sometimes|required|integer',
                'photo' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:2048',
                'description' => 'sometimes|required|string',
                'is_added' => 'sometimes|boolean',
                'status' => 'sometimes|required|in:Pending,Approved,Rejected',
                'approved_by' => 'sometimes|required|exists:users,id',
                'product_id' => 'sometimes|nullable|exists:products,id',
                'approved_at' => 'sometimes|nullable|date',
                'rejection_reason' => 'sometimes|nullable|string'
            ]);

            // Handle photo upload
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                if ($file->isValid()) {
                    // Delete old photo if exists
                    if ($itemRequest->photo) {
                        Storage::disk('public')->delete($itemRequest->photo);
                    }

                    // Store the file and get the relative path
                    $path = $file->store('item-requests', 'public');
                    // Clean the path to remove any full URL
                    $path = str_replace('public/', '', $path);
                    $validated['photo'] = $path;
                } else {
                    return response()->json([
                        'message' => 'Invalid file upload',
                        'error' => 'The uploaded file is not valid'
                    ], 422);
                }
            }

            // Ensure is_added is boolean
            if (isset($validated['is_added'])) {
                $validated['is_added'] = (bool) $validated['is_added'];
            }

            $itemRequest->update($validated);

            return response()->json([
                'message' => 'Item request updated successfully',
                'data' => new ItemRequestResource($itemRequest)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update item request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status of the specified resource.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            $itemRequest = ItemRequest::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:Pending,Approved,Rejected',
                'approved_by' => 'required_if:status,Approved|nullable|exists:users,id',
                'rejection_reason' => 'required_if:status,Rejected|nullable|string',
                'product_id' => 'nullable|exists:products,id'
            ]);

            // Set approved_at if status is Approved
            if ($validated['status'] === 'Approved') {
                $validated['approved_at'] = now();
                $validated['is_added'] = true;
            }

            $itemRequest->update($validated);

            return response()->json([
                'message' => 'Item request status updated successfully',
                'data' => new ItemRequestResource($itemRequest)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update item request status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark an item as requested.
     */
    public function markAsRequested(Request $request, string $id): JsonResponse
    {
        try {
            $itemRequest = ItemRequest::findOrFail($id);

            $itemRequest->update([
                'is_requested' => true
            ]);

            return response()->json([
                'message' => 'Item marked as requested successfully',
                'data' => new ItemRequestResource($itemRequest)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark item as requested',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $itemRequest = ItemRequest::where('user_id', Auth::id())
                ->findOrFail($id);

            // Delete photo if exists
            if ($itemRequest->photo) {
                Storage::disk('public')->delete($itemRequest->photo);
            }

            $itemRequest->delete();

            return response()->json([
                'message' => 'Item request deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete item request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
