<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MaterialRequest\StoreMaterialRequestRequest;
use App\Http\Requests\V1\MaterialRequest\UpdateMaterialRequestRequest;
use App\Http\Resources\V1\MaterialRequestResource;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\QueryParameters\MaterialRequestParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class MaterialRequestController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $requests = QueryBuilder::for(MaterialRequest::class)
            ->allowedFilters(MaterialRequestParameters::ALLOWED_FILTERS)
            ->allowedSorts(MaterialRequestParameters::ALLOWED_SORTS)
            ->allowedIncludes(MaterialRequestParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($requests->isEmpty()) {
            return response()->json([
                'message' => 'No material requests found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MaterialRequestResource::collection($requests);
    }

    public function store(StoreMaterialRequestRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Create material request
            $materialRequest = MaterialRequest::create($request->safe()->except('items'));

            // Create material request items
            foreach ($request->input('items') as $item) {
                $materialRequest->items()->create($item);
            }

            DB::commit();

            return response()->json([
                'message' => 'Material request created successfully',
                'data' => new MaterialRequestResource(
                    $materialRequest->load([
                        'requester',
                        'warehouse',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'status',
                        'items.product',
                        'items.unit',
                        'items.category',
                        'items.urgencyStatus'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create material request',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $request = QueryBuilder::for(MaterialRequest::class)
            ->allowedIncludes(MaterialRequestParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new MaterialRequestResource($request)
        ], Response::HTTP_OK);
    }

    public function update(UpdateMaterialRequestRequest $request, MaterialRequest $materialRequest): JsonResponse
    {
        try {
            $materialRequest->update($request->validated());

            return response()->json([
                'message' => 'Material request updated successfully',
                'data' => new MaterialRequestResource(
                    $materialRequest->load([
                        'requester',
                        'warehouse',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'status',
                        'items.product',
                        'items.unit',
                        'items.category',
                        'items.urgencyStatus'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update material request',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(MaterialRequest $materialRequest): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete related items first
            $materialRequest->items()->delete();

            // Delete the material request
            $materialRequest->delete();

            DB::commit();

            return response()->json([
                'message' => 'Material request deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete material request',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
