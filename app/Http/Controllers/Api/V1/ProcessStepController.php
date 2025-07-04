<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ProcessStep\StoreProcessStepRequest;
use App\Http\Requests\V1\ProcessStep\UpdateProcessStepRequest;
use App\Http\Resources\V1\ProcessStepResource;
use App\Http\Resources\V1\ProcessStepCollection;
use App\Http\Resources\V1\ProcessResource;
use App\Models\Designation;
use App\Models\Process;
use App\Models\ProcessStep;
use App\Models\User;
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
    public function store(StoreProcessStepRequest $request)
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



    /*
    public function getApproverIdViaDesignation(ProcessStep $processStep, User $user = null)
    {
        // If $user is null, get the default user (e.g., the authenticated user)
        if ($user === null) {
            $user = auth()->user();

            if ($user === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'No user provided and no authenticated user found.',
                ], Response::HTTP_BAD_REQUEST);
            }
        }


        // Check if process step has approver_id already set
        if (!empty($processStep->approver_id)) {
            return response()->json([
                'success' => true,
                'message' => 'Your process step contains an approver id.',
                'data' => $processStep,
            ], Response::HTTP_OK);
        }

        // Check if process step has designation_id set
        if (empty($processStep->designation_id) || $processStep->designation_id  == 14) {
            return response()->json([
                'success' => true,
                'message' => 'Approver is a direct manager.',
                'parent_id' => $user->parent_id,
                'user' => User::findOrFail($user->parent_id),
            ], Response::HTTP_OK);
        }


        // Get designation details
        $required_designation_id = $processStep->designation_id;
        $designation = Designation::find($required_designation_id);
        $designation_name = $designation ? $designation->designation : 'Unknown';

        // Prepare process step info to include in all responses
        $process_step_info = [
            'id' => $processStep->id,
            'order' => $processStep->order,
            'designation_id' => $processStep->designation_id,
            'parent_id' => $user->parent_id,
        ];

        // Trace up the hierarchy to find a matching approver
        $currentUser = $user;

        while ($currentUser) {

            // Check if current user has the required designation
            if ($currentUser->designation_id == $required_designation_id) {
                return response()->json([
                    'success' => true,
                    'message' => 'Matching User / Approver found in hierarchy.',
                    'user' => [
                        'user' => $currentUser,
                        'designation' => $designation_name
                    ],
                    'process_step' => $process_step_info
                ], Response::HTTP_OK);
            }

            // Move to parent if available
            if ($currentUser->parent_id) {
                $currentUser = User::find($currentUser->parent_id);
            } else {
                // Reached the top of hierarchy without finding a match
                break;
            }
        }

        // No matching approver found
        return response()->json([
            'success' => true,
            'message' => 'No user with the required designation found in the hierarchy.',
            'designation_required' => $designation_name,
            'process_step' => $process_step_info
        ], Response::HTTP_OK);
    }
   */


    /**
     * Get the approver ID based on the process step and user's designation hierarchy
     *
     * @param ProcessStep $processStep
     * @param User|null $user The user for whom to find an approver (defaults to authenticated user)
     * @return \Illuminate\Http\JsonResponse
     */
    public function getApproverIdViaDesignation(ProcessStep $processStep, User $user = null)
    {
        // If $user is null, get the default user (e.g., the authenticated user)
        if ($user === null) {
            $user = auth()->user();

            if ($user === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'No user provided and no authenticated user found.'
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        // Check if process step has approver_id already set
        if (!empty($processStep->approver_id)) {
            return response()->json([
                'success' => true,
                'message' => 'Your process step contains an approver id.',
                'data' => [
                    'approver_id' => $processStep->approver_id,
                    'process_step' => $processStep
                ]
            ], Response::HTTP_OK);
        }

        // Check if process step has designation_id set
        if (empty($processStep->designation_id) || $processStep->designation_id == 14) {
            $parentUser = User::find($user->parent_id);

            return response()->json([
                'success' => true,
                'message' => 'Approver is a direct manager.',
                'data' => [
                    'approver_id' => $user->parent_id,
                    'approver' => $parentUser
                ]
            ], Response::HTTP_OK);
        }

        // Get designation details
        $required_designation_id = $processStep->designation_id;
        $designation = Designation::find($required_designation_id);
        $designation_name = $designation ? $designation->designation : 'Unknown';

        // Prepare process step info to include in all responses
        $process_step_info = [
            'id' => $processStep->id,
            'order' => $processStep->order,
            'designation_id' => $processStep->designation_id
        ];

        // Trace up the hierarchy to find a matching approver
        $currentUser = $user;

        while ($currentUser) {
            // Check if current user has the required designation
            if ($currentUser->designation_id == $required_designation_id) {
                return response()->json([
                    'success' => true,
                    'message' => 'Matching User / Approver found in hierarchy.',
                    'data' => [
                        'approver_id' => $currentUser->id,
                        'approver' => $currentUser,
                        'designation' => $designation_name,
                        'process_step' => $process_step_info
                    ]
                ], Response::HTTP_OK);
            }

            // Move to parent if available
            if ($currentUser->parent_id) {
                $currentUser = User::find($currentUser->parent_id);
            } else {
                // Reached the top of hierarchy without finding a match
                break;
            }
        }

        // No matching approver found
        return response()->json([
            'success' => true,
            'message' => 'No user with the required designation found in the hierarchy.',
            'data' => [
                'approver_id' => $user->parent_id,
                'designation_required' => $designation_name,
                'process_step' => $process_step_info
            ]
        ], Response::HTTP_OK);
    }
}
