<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ProcessStep\StoreProcessStepRequest;
use App\Http\Requests\V1\ProcessStep\UpdateProcessStepRequest;
use App\Http\Resources\V1\ProcessStepResource;
use App\Http\Resources\V1\ProcessStepCollection;
use App\Models\Process;
use App\Models\ProcessStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class ProcessStepController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse|ProcessStepCollection
    {
        $query = QueryBuilder::for(ProcessStep::class)
            ->allowedFilters(['process_id', 'user_id', 'name', 'status', 'is_active'])
            ->allowedSorts(['id', 'process_id', 'order', 'name', 'created_at'])
            ->allowedIncludes(['process', 'user', 'creator', 'updater']);

        // Filter by process_id if provided
        if ($request->has('process_id')) {
            $query->where('process_id', $request->process_id);
        }

        $steps = $query->paginate($request->per_page ?? 15)
            ->appends($request->query());

        if ($steps->isEmpty()) {
            return response()->json([
                'message' => 'No process steps found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new ProcessStepCollection($steps);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProcessStepRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = auth()->user();
            $stepData = $request->validated();

            // Add user IDs for tracking
            $stepData['created_by'] = $user->id;
            $stepData['updated_by'] = $user->id;

            // Validate that process exists
            $process = Process::findOrFail($stepData['process_id']);

            // Create step
            $step = ProcessStep::create($stepData);

            DB::commit();

            return response()->json([
                'message' => 'Process step created successfully',
                'data' => new ProcessStepResource($step->load(['process', 'user']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create process step',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $step = QueryBuilder::for(ProcessStep::class)
            ->allowedIncludes(['process', 'user', 'creator', 'updater'])
            ->findOrFail($id);

        return response()->json([
            'data' => new ProcessStepResource($step)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProcessStepRequest $request, ProcessStep $processStep): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = auth()->user();
            $stepData = $request->validated();
            $stepData['updated_by'] = $user->id;

            $processStep->update($stepData);

            DB::commit();

            return response()->json([
                'message' => 'Process step updated successfully',
                'data' => new ProcessStepResource($processStep->load(['process', 'user']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update process step',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProcessStep $processStep): JsonResponse
    {
        try {
            $processStep->delete();

            return response()->json([
                'message' => 'Process step deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete process step',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the status of a process step
     */
    public function updateStatus(Request $request, ProcessStep $processStep): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:Pending,In Progress,Approved,Rejected,Skipped'],
        ]);

        try {
            $processStep->status = $request->input('status');
            $processStep->updated_by = auth()->id();
            $processStep->save();

            return response()->json([
                'message' => 'Process step status updated successfully',
                'data' => new ProcessStepResource($processStep)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update process step status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Reorder process steps
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'process_id' => ['required', 'exists:processes,id'],
            'steps' => ['required', 'array'],
            'steps.*.id' => ['required', 'exists:process_steps,id'],
            'steps.*.order' => ['required', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            $process = Process::findOrFail($request->process_id);
            $steps = $request->steps;

            // Verify all steps belong to the process
            foreach ($steps as $step) {
                $processStep = ProcessStep::findOrFail($step['id']);
                if ($processStep->process_id != $process->id) {
                    return response()->json([
                        'message' => 'One or more steps do not belong to the specified process',
                    ], Response::HTTP_BAD_REQUEST);
                }
            }

            // Update order of steps
            foreach ($steps as $step) {
                ProcessStep::where('id', $step['id'])->update([
                    'order' => $step['order'],
                    'updated_by' => auth()->id()
                ]);
            }

            DB::commit();

            // Return the updated process with steps
            $process->load('steps');

            return response()->json([
                'message' => 'Process steps reordered successfully',
                'data' => new ProcessResource($process)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reorder process steps',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Toggle active status of a process step
     */
    public function toggleActive(ProcessStep $processStep): JsonResponse
    {
        try {
            $processStep->is_active = !$processStep->is_active;
            $processStep->updated_by = auth()->id();
            $processStep->save();

            return response()->json([
                'message' => 'Process step ' . ($processStep->is_active ? 'activated' : 'deactivated') . ' successfully',
                'data' => new ProcessStepResource($processStep)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle process step status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
