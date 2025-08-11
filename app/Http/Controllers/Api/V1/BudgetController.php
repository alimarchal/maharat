<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Budget\StoreBudgetRequest;
use App\Http\Requests\V1\Budget\UpdateBudgetRequest;
use App\Http\Resources\V1\BudgetResource;
use App\Models\Budget;
use App\QueryParameters\BudgetParameters;
use App\QueryFilters\FiscalPeriodStatusFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class BudgetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        // Get the current page and per_page from request
        $perPage = request('per_page', 15);
        $currentPage = request('page', 1);

        // First, get the total count of unique fiscal periods
        $totalFiscalPeriods = QueryBuilder::for(Budget::class)
            ->allowedFilters([
                ...BudgetParameters::ALLOWED_FILTERS,
            ])
            ->distinct('fiscal_period_id')
            ->count('fiscal_period_id');

        // Calculate the offset
        $offset = ($currentPage - 1) * $perPage;

        // Get unique fiscal period IDs for pagination
        $fiscalPeriodIds = QueryBuilder::for(Budget::class)
            ->allowedFilters([
                ...BudgetParameters::ALLOWED_FILTERS,
            ])
            ->distinct('fiscal_period_id')
            ->orderBy('fiscal_period_id', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->pluck('fiscal_period_id');

        // Then, get all budgets for the selected fiscal periods with includes
        $budgets = QueryBuilder::for(Budget::class)
            ->allowedFilters([
                ...BudgetParameters::ALLOWED_FILTERS,
            ])
            ->allowedSorts(BudgetParameters::ALLOWED_SORTS)
            ->allowedIncludes(BudgetParameters::ALLOWED_INCLUDES)
            ->whereIn('fiscal_period_id', $fiscalPeriodIds)
            ->orderBy('fiscal_period_id', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // Create a custom paginator instance based on fiscal periods
        $budgets = new \Illuminate\Pagination\LengthAwarePaginator(
            $budgets,
            $totalFiscalPeriods,
            $perPage,
            $currentPage,
            [
                'path' => request()->url(),
                'pageName' => 'page',
            ]
        );

        // Add query parameters to pagination links
        $budgets->appends(request()->query());

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

            // Check if budget already exists for this combination
            if (Budget::existsForCombination(
                $request->fiscal_period_id,
                $request->cost_center_id,
                $request->sub_cost_center_id
            )) {
                return response()->json([
                    'message' => 'A budget already exists for this fiscal period, cost center, and sub cost center combination.',
                    'error' => 'DUPLICATE_BUDGET'
                ], Response::HTTP_CONFLICT);
            }

            $budget = Budget::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Budget created successfully',
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

            // Check if budget already exists for this combination (excluding current budget)
            if (Budget::existsForCombination(
                $request->fiscal_period_id,
                $request->cost_center_id,
                $request->sub_cost_center_id,
                $budget->id
            )) {
                return response()->json([
                    'message' => 'A budget already exists for this fiscal period, cost center, and sub cost center combination.',
                    'error' => 'DUPLICATE_BUDGET'
                ], Response::HTTP_CONFLICT);
            }

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
            
            // Check if budget already exists for this combination before restoring
            if (Budget::existsForCombination(
                $budget->fiscal_period_id,
                $budget->cost_center_id,
                $budget->sub_cost_center_id
            )) {
                return response()->json([
                    'message' => 'Cannot restore budget. A budget already exists for this fiscal period, cost center, and sub cost center combination.',
                    'error' => 'DUPLICATE_BUDGET'
                ], Response::HTTP_CONFLICT);
            }

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

    /**
     * Get budget for specific combination.
     */
    public function getForCombination(): JsonResponse
    {
        $request = request();
        
        $fiscalPeriodId = $request->fiscal_period_id;
        $costCenterId = $request->cost_center_id;
        $subCostCenterId = $request->sub_cost_center_id;

        if (!$fiscalPeriodId || !$costCenterId) {
            return response()->json([
                'message' => 'Fiscal period ID and cost center ID are required',
                'error' => 'MISSING_REQUIRED_FIELDS'
            ], Response::HTTP_BAD_REQUEST);
        }

        $budget = Budget::getForCombination($fiscalPeriodId, $costCenterId, $subCostCenterId);

        if (!$budget) {
            return response()->json([
                'message' => 'No budget found for this combination',
                'data' => null
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => new BudgetResource($budget->load([
                'fiscalPeriod',
                'department',
                'costCenter',
                'subCostCenter',
                'creator',
                'updater'
            ]))
        ], Response::HTTP_OK);
    }
}
