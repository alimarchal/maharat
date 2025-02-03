<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreStatusRequest;
use App\Http\Requests\V1\UpdateStatusRequest;
use App\Http\Resources\V1\StatusResource;
use App\Models\Status;
use App\QueryParameters\StatusParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class StatusController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $statuses = QueryBuilder::for(Status::class)
            ->allowedFilters(StatusParameters::ALLOWED_FILTERS)
            ->allowedSorts(StatusParameters::ALLOWED_SORTS)
            ->paginate()
            ->appends(request()->query());

        if ($statuses->isEmpty()) {
            return response()->json([
                'message' => 'No statuses found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return StatusResource::collection($statuses);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStatusRequest $request): JsonResponse
    {
        try {
            $status = Status::create($request->validated());

            return response()->json([
                'message' => 'Status created successfully',
                'data' => new StatusResource($status)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $status = QueryBuilder::for(Status::class)
            ->allowedIncludes(StatusParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new StatusResource($status)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStatusRequest $request, Status $status): JsonResponse
    {
        try {
            $status->update($request->validated());

            return response()->json([
                'message' => 'Status updated successfully',
                'data' => new StatusResource($status)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Status $status): JsonResponse
    {
        try {
            $status->delete();

            return response()->json([
                'message' => 'Status deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
