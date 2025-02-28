<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\TaskDescription\StoreTaskDescriptionRequest;
use App\Http\Requests\V1\TaskDescription\UpdateTaskDescriptionRequest;
use App\Http\Resources\V1\TaskDescriptionResource;
use App\Http\Resources\V1\TaskDescriptionCollection;
use App\Models\TaskDescription;
use App\QueryParameters\TaskDescriptionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class TaskDescriptionController extends Controller
{
    public function index(): JsonResponse
    {
        $descriptions = QueryBuilder::for(TaskDescription::class)
            ->allowedFilters(TaskDescriptionParameters::ALLOWED_FILTERS)
            ->allowedSorts(TaskDescriptionParameters::ALLOWED_SORTS)
            ->allowedIncludes(TaskDescriptionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($descriptions->isEmpty()) {
            return response()->json([
                'message' => 'No task descriptions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskDescriptionCollection($descriptions), Response::HTTP_OK);
    }

    public function store(StoreTaskDescriptionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $description = TaskDescription::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Task description created successfully',
                'data' => new TaskDescriptionResource($description->load(['task', 'user']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create task description',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $description = QueryBuilder::for(TaskDescription::class)
            ->allowedIncludes(TaskDescriptionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new TaskDescriptionResource($description)
        ], Response::HTTP_OK);
    }

    public function update(UpdateTaskDescriptionRequest $request, TaskDescription $taskDescription): JsonResponse
    {
        try {
            DB::beginTransaction();

            $taskDescription->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Task description updated successfully',
                'data' => new TaskDescriptionResource($taskDescription->load(['task', 'user']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update task description',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(TaskDescription $taskDescription): JsonResponse
    {
        try {
            DB::beginTransaction();

            $taskDescription->delete();

            DB::commit();

            return response()->json([
                'message' => 'Task description deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete task description',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getByAction(string $action): JsonResponse
    {
        $descriptions = QueryBuilder::for(TaskDescription::class)
            ->where('action', $action)
            ->allowedIncludes(TaskDescriptionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($descriptions->isEmpty()) {
            return response()->json([
                'message' => "No task descriptions found with action: {$action}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskDescriptionCollection($descriptions), Response::HTTP_OK);
    }

    public function getByTaskId(string $taskId): JsonResponse
    {
        $descriptions = QueryBuilder::for(TaskDescription::class)
            ->where('task_id', $taskId)
            ->allowedIncludes(TaskDescriptionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($descriptions->isEmpty()) {
            return response()->json([
                'message' => "No task descriptions found for task ID: {$taskId}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskDescriptionCollection($descriptions), Response::HTTP_OK);
    }
}
