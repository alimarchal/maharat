<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Task\StoreTaskRequest;
use App\Http\Requests\V1\Task\UpdateTaskRequest;
use App\Http\Resources\V1\TaskResource;
use App\Http\Resources\V1\TaskCollection;
use App\Models\Task;
use App\Models\TaskDescription;
use App\QueryParameters\TaskParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = QueryBuilder::for(Task::class)
            ->allowedFilters(TaskParameters::getAllFilters())
            ->allowedSorts(TaskParameters::ALLOWED_SORTS)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($tasks->isEmpty()) {
            return response()->json([
                'message' => 'No tasks found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskCollection($tasks), Response::HTTP_OK);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task = Task::create($request->safe()->except('descriptions'));

            // Create task descriptions if provided
            if ($request->has('descriptions')) {
                foreach ($request->input('descriptions') as $description) {
                    $task->descriptions()->create($description);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Task created successfully',
                'data' => new TaskResource($task->load([
                    'processStep',
                    'process',
                    'assignedFromUser',
                    'assignedToUser',
                    'descriptions',
                    'material_request',
                    'rfq',
                    'purchase_order',
                    'payment_order',
                    'invoice',
                    'budget',
                    'budget_approval_transaction',
                    'request_budget',
                ]))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $task = QueryBuilder::for(Task::class)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new TaskResource($task)
        ], Response::HTTP_OK);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Task updated successfully',
                'data' => new TaskResource($task->load([
                    'processStep',
                    'process',
                    'assignedUser',
                    'descriptions',
                    'material_request',
                    'rfq',
                    'purchase_order',
                    'payment_order',
                    'invoice',
                    'budget',
                    'budget_approval_transaction',
                    'request_budget',
                ]))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Task $task): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task->delete();

            DB::commit();

            return response()->json([
                'message' => 'Task deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function markAsRead(Task $task): JsonResponse
    {
        try {
            $task->update(['read_status' => now()]);

            return response()->json([
                'message' => 'Task marked as read',
                'data' => new TaskResource($task)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark task as read',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getByUrgency(string $urgency): JsonResponse
    {
        $tasks = QueryBuilder::for(Task::class)
            ->where('urgency', $urgency)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($tasks->isEmpty()) {
            return response()->json([
                'message' => "No tasks found with urgency: {$urgency}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskCollection($tasks), Response::HTTP_OK);
    }
}
