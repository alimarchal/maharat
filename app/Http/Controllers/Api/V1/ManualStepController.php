<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ManualStepStoreRequest;
use App\Http\Requests\ManualStepUpdateRequest;
use App\Http\Requests\ManualStepReorderRequest;
use App\Http\Resources\ManualStepResource;
use App\Http\Resources\ManualStepCollection;
use App\Models\UserManual;
use App\Models\ManualStep;
use App\Services\ManualStepService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ManualStepController extends Controller
{
    protected $service;

    public function __construct(ManualStepService $service)
    {
        $this->service = $service;
    }

    public function index(UserManual $userManual): ManualStepCollection
    {
        $steps = $userManual->steps()
            ->with(['details', 'screenshots', 'actions'])
            ->orderBy('step_number')
            ->get();

        return new ManualStepCollection($steps);
    }

    public function store(ManualStepStoreRequest $request, UserManual $userManual): JsonResponse
    {
        try {
            $step = $this->service->createStep($userManual, $request->validated());

            return response()->json(new ManualStepResource($step), 201);
        } catch (\Exception $e) {
            Log::error('Error creating manual step: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to create manual step',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(UserManual $userManual, ManualStep $step): ManualStepResource
    {
        // Ensure the step belongs to the manual
        if ($step->user_manual_id !== $userManual->id) {
            abort(404);
        }

        $step->load(['details', 'screenshots', 'actions']);

        return new ManualStepResource($step);
    }

    public function update(ManualStepUpdateRequest $request, UserManual $userManual, ManualStep $step): JsonResponse
    {
        try {
            // Ensure the step belongs to the manual
            if ($step->user_manual_id !== $userManual->id) {
                abort(404);
            }

            $step = $this->service->updateStep($step, $request->validated());

            return response()->json(new ManualStepResource($step));
        } catch (\Exception $e) {
            Log::error('Error updating manual step: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to update manual step',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(UserManual $userManual, ManualStep $step): JsonResponse
    {
        try {
            // Ensure the step belongs to the manual
            if ($step->user_manual_id !== $userManual->id) {
                abort(404);
            }

            // Check if force delete is requested
            if (request()->query('force')) {
                $step->forceDelete();
            } else {
                $step->delete();
            }

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting manual step: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to delete manual step',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reorder(ManualStepReorderRequest $request, UserManual $userManual): JsonResponse
    {
        try {
            $steps = $this->service->reorderSteps($userManual, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Steps reordered successfully',
                'data' => ManualStepResource::collection($steps)
            ]);
        } catch (\Exception $e) {
            Log::error('Error reordering manual steps: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder manual steps',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
