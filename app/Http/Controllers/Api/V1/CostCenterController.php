<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\CostCenter\StoreCostCenterRequest;
use App\Http\Requests\V1\CostCenter\UpdateCostCenterRequest;
use App\Http\Resources\V1\CostCenterResource;
use App\Models\CostCenter;
use App\QueryParameters\CostCenterParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class CostCenterController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $costCenters = QueryBuilder::for(CostCenter::class)
            ->allowedFilters(CostCenterParameters::ALLOWED_FILTERS)
            ->allowedSorts(CostCenterParameters::ALLOWED_SORTS)
            ->allowedIncludes(CostCenterParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($costCenters->isEmpty()) {
            return response()->json([
                'message' => 'No cost centers found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return CostCenterResource::collection($costCenters);
    }

    public function store(StoreCostCenterRequest $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['created_by'] = Auth::id();
            $validated['updated_by'] = Auth::id();

            $costCenter = CostCenter::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Cost center created successfully',
                'data' => new CostCenterResource(
                    $costCenter->load([
                        'parent',
                        'children',
                        'department',
                        'manager',
                        'budgetOwner',
                        'createdBy',
                        'updatedBy'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create cost center',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $costCenter = QueryBuilder::for(CostCenter::class)
            ->allowedIncludes(CostCenterParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new CostCenterResource($costCenter)
        ], Response::HTTP_OK);
    }

    public function update(UpdateCostCenterRequest $request, CostCenter $costCenter): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            $validated['updated_by'] = Auth::id();

            $costCenter->update($validated);

            DB::commit();

            return response()->json([
                'message' => 'Cost center updated successfully',
                'data' => new CostCenterResource(
                    $costCenter->load([
                        'parent',
                        'children',
                        'department',
                        'manager',
                        'budgetOwner',
                        'createdBy',
                        'updatedBy'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update cost center',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(CostCenter $costCenter): JsonResponse
    {
        try {
            $costCenter->delete();

            return response()->json([
                'message' => 'Cost center deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete cost center',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function tree(): JsonResponse
    {
        $costCenters = CostCenter::with('children')
            ->whereNull('parent_id')
            ->get();

        return response()->json([
            'data' => CostCenterResource::collection($costCenters)
        ], Response::HTTP_OK);
    }

    public function restore(Request $request): JsonResponse
    {
        try {
            $costCenter = CostCenter::withTrashed()->findOrFail($request->id);
            $costCenter->restore();

            return response()->json([
                'message' => 'Cost center restored successfully',
                'data' => new CostCenterResource($costCenter)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to restore cost center',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
