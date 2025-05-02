<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserManualStoreRequest;
use App\Http\Requests\UserManualUpdateRequest;
use App\Http\Resources\UserManualResource;
use App\Http\Resources\UserManualCollection;
use App\Models\UserManual;
use App\Services\UserManualService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class UserManualController extends Controller
{
    protected $service;

    public function __construct(UserManualService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): UserManualCollection
    {
        $query = UserManual::with(['steps', 'creator']);

        // Apply filters
        if ($request->has('filter')) {
            foreach ($request->input('filter') as $field => $value) {
                $query->where($field, 'like', "%{$value}%");
            }
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sortField = $request->input('sort');
            $sortDirection = 'asc';

            if (strpos($sortField, '-') === 0) {
                $sortDirection = 'desc';
                $sortField = ltrim($sortField, '-');
            }

            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->input('per_page', 15);

        return new UserManualCollection($query->paginate($perPage));
    }

    public function store(UserManualStoreRequest $request): JsonResponse
    {
        try {
            $manual = $this->service->createManual($request->validated());

            return response()->json(new UserManualResource($manual), 201);
        } catch (\Exception $e) {
            Log::error('Error creating user manual: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to create user manual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(UserManual $userManual): UserManualResource
    {
        // Check for include parameters to load relationships
        $includes = request()->query('include');
        if ($includes) {
            $relations = explode(',', $includes);
            $userManual->load($relations);
        } else {
            // Default relationships to load
            $userManual->load(['steps.details', 'steps.screenshots', 'steps.actions', 'creator', 'updater', 'card']);
        }

        Log::info('Showing user manual', [
            'id' => $userManual->id,
            'title' => $userManual->title,
            'card_id' => $userManual->card_id,
            'video_path' => $userManual->video_path,
            'relationships_loaded' => array_keys($userManual->getRelations())
        ]);

        return new UserManualResource($userManual);
    }

    public function update(UserManualUpdateRequest $request, UserManual $userManual): JsonResponse
    {
        try {
            Log::info('Updating user manual', [
                'manual_id' => $userManual->id,
                'request_data' => $request->all()
            ]);

            $manual = $this->service->updateManual($userManual, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'User manual updated successfully',
                'data' => new UserManualResource($manual)
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user manual: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user manual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(UserManual $userManual): JsonResponse
    {
        try {
            $userManual->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting user manual: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to delete user manual',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cards that don't have manuals
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkManualExists()
    {
        try {
            // Get all card IDs that have manuals
            $cardsWithManuals = UserManual::pluck('card_id')->toArray();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'cards_with_manuals' => $cardsWithManuals
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking manual existence: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error checking manual existence',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get steps for a specific user manual
     *
     * @param UserManual $userManual
     * @return JsonResponse
     */
    public function getSteps(UserManual $userManual): JsonResponse
    {
        try {
            Log::info('Getting steps for manual', [
                'manual_id' => $userManual->id,
                'title' => $userManual->title
            ]);

            $steps = $userManual->steps()
                ->with([
                    'details',
                    'screenshots' => function($query) {
                        $query->orderBy('order');
                    },
                    'actions' => function($query) {
                        $query->orderBy('order');
                    }
                ])
                ->orderBy('step_number')
                ->get();

            Log::info('Retrieved steps', [
                'manual_id' => $userManual->id,
                'step_count' => $steps->count(),
                'steps' => $steps->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $steps
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting manual steps: ' . $e->getMessage(), [
                'manual_id' => $userManual->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get manual steps',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
