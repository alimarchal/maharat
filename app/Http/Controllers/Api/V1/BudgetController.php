<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Budget\StoreBudgetRequest;
use App\Http\Requests\V1\Budget\UpdateBudgetRequest;
use App\Http\Resources\V1\BudgetResource;
use App\Models\Budget;
use App\QueryParameters\BudgetParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class BudgetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $budgets = QueryBuilder::for(Budget::class)
            ->allowedFilters(BudgetParameters::ALLOWED_FILTERS)
            ->allowedSorts(BudgetParameters::ALLOWED_SORTS)
            ->allowedIncludes(BudgetParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($budgets->isEmpty()) {
            return response()->json([
                'message' => 'No budgets found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return BudgetResource::collection($budgets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBudgetRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budget = Budget::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Budget created successfully',
                'data' => new BudgetResource(
                    $budget->load([
                        'fiscalPeriod',
                        'department',
                        'costCenter',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $budget = QueryBuilder::for(Budget::class)
            ->allowedIncludes(BudgetParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new BudgetResource($budget)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBudgetRequest $request, Budget $budget): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budget->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Budget updated successfully',
                'data' => new BudgetResource(
                    $budget->load([
                        'fiscalPeriod',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Budget $budget): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budget->delete();

            DB::commit();

            return response()->json([
                'message' => 'Budget deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted budget.
     */
    public function restore(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budget = Budget::withTrashed()->findOrFail($id);
            $budget->restore();

            DB::commit();

            return response()->json([
                'message' => 'Budget restored successfully',
                'data' => new BudgetResource($budget)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
