<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Process\StoreProcessRequest;
use App\Http\Requests\V1\Process\UpdateProcessRequest;
use App\Http\Resources\V1\ProcessResource;
use App\Http\Resources\V1\ProcessCollection;
use App\Models\Process;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class ProcessController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse|ProcessCollection
    {
        $processes = QueryBuilder::for(Process::class)
            ->allowedFilters(['title', 'is_active', 'status', 'created_by'])
            ->allowedSorts(['id', 'title', 'created_at', 'updated_at'])
            ->allowedIncludes(['steps', 'creator', 'updater'])
            ->paginate($request->per_page ?? 15)
            ->appends($request->query());

        if ($processes->isEmpty()) {
            return response()->json([
                'message' => 'No processes found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new ProcessCollection($processes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProcessRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = auth()->user();
            $processData = $request->validated();
            $stepsData = $processData['steps'] ?? [];
            unset($processData['steps']);

            // Add user ID for created_by
            $processData['created_by'] = $user->id;
            $processData['updated_by'] = $user->id;

            $process = Process::create($processData);

            // Create steps if provided
            if (!empty($stepsData)) {
                foreach ($stepsData as $stepData) {
                    $stepData['process_id'] = $process->id;
                    $stepData['created_by'] = $user->id;
                    $stepData['updated_by'] = $user->id;
                    $process->steps()->create($stepData);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Process created successfully',
                'data' => new ProcessResource($process->load('steps'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create process',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $process = QueryBuilder::for(Process::class)
            ->allowedIncludes(['steps', 'steps.user', 'creator', 'updater'])
            ->findOrFail($id);

        return response()->json([
            'data' => new ProcessResource($process)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProcessRequest $request, Process $process): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = auth()->user();
            $processData = $request->validated();
            $processData['updated_by'] = $user->id;

            $process->update($processData);

            DB::commit();

            return response()->json([
                'message' => 'Process updated successfully',
                'data' => new ProcessResource($process->load('steps'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update process',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Process $process): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete associated steps first
            $process->steps()->delete();

            // Delete the process
            $process->delete();

            DB::commit();

            return response()->json([
                'message' => 'Process deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete process',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Activate/deactivate a process
     */
    public function toggleActive(Process $process): JsonResponse
    {
        try {
            $process->is_active = !$process->is_active;
            $process->updated_by = auth()->id();
            $process->save();

            return response()->json([
                'message' => 'Process ' . ($process->is_active ? 'activated' : 'deactivated') . ' successfully',
                'data' => new ProcessResource($process)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle process status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update process status
     */
    public function updateStatus(Request $request, Process $process): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:Active,Pending,Rejected,Expired'],
        ]);

        try {
            $process->status = $request->input('status');
            $process->updated_by = auth()->id();
            $process->save();

            return response()->json([
                'message' => 'Process status updated successfully',
                'data' => new ProcessResource($process)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update process status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
