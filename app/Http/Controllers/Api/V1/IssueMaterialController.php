<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\IssueMaterial\StoreIssueMaterialRequest;
use App\Http\Requests\V1\IssueMaterial\UpdateIssueMaterialRequest;
use App\Http\Resources\V1\IssueMaterialResource;
use App\Http\Resources\V1\IssueMaterialCollection;
use App\Models\IssueMaterial;
use App\QueryParameters\IssueMaterialParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class IssueMaterialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|IssueMaterialCollection
    {
        $issueMaterials = QueryBuilder::for(IssueMaterial::class)
            ->allowedFilters(IssueMaterialParameters::ALLOWED_FILTERS)
            ->allowedSorts(IssueMaterialParameters::ALLOWED_SORTS)
            ->allowedIncludes(IssueMaterialParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($issueMaterials->isEmpty()) {
            return response()->json([
                'message' => 'No issue materials found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new IssueMaterialCollection($issueMaterials);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIssueMaterialRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Add current user as creator
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $issueMaterial = IssueMaterial::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Issue material created successfully',
                'data' => new IssueMaterialResource(
                    $issueMaterial->load([
                        'materialRequest',
                        'costCenter',
                        'subCostCenter',
                        'department',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create issue material',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $issueMaterial = QueryBuilder::for(IssueMaterial::class)
            ->allowedIncludes(IssueMaterialParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new IssueMaterialResource($issueMaterial)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIssueMaterialRequest $request, IssueMaterial $issueMaterial): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Add current user as updater
            $data['updated_by'] = auth()->id();

            $issueMaterial->update($data);

            DB::commit();

            return response()->json([
                'message' => 'Issue material updated successfully',
                'data' => new IssueMaterialResource(
                    $issueMaterial->load([
                        'materialRequest',
                        'costCenter',
                        'subCostCenter',
                        'department',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update issue material',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(IssueMaterial $issueMaterial): JsonResponse
    {
        try {
            DB::beginTransaction();

            $issueMaterial->delete();

            DB::commit();

            return response()->json([
                'message' => 'Issue material deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete issue material',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted resource.
     */
    public function restore(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $issueMaterial = IssueMaterial::withTrashed()->findOrFail($id);
            $issueMaterial->restore();

            DB::commit();

            return response()->json([
                'message' => 'Issue material restored successfully',
                'data' => new IssueMaterialResource($issueMaterial)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore issue material',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
