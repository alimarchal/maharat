<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\BudgetUsage\StoreBudgetUsageRequest;
use App\Http\Requests\V1\BudgetUsage\UpdateBudgetUsageRequest;
use App\Http\Resources\V1\BudgetUsageResource;
use App\Http\Resources\V1\BudgetUsageCollection;
use App\Models\BudgetUsage;
use App\QueryParameters\BudgetUsageParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class BudgetUsageController extends Controller
{
    /**
     * Display a listing of budget usages.
     */
    public function index(): JsonResponse|BudgetUsageCollection
    {
        $budgetUsages = QueryBuilder::for(BudgetUsage::class)
            ->allowedFilters(BudgetUsageParameters::ALLOWED_FILTERS)
            ->allowedSorts(BudgetUsageParameters::ALLOWED_SORTS)
            ->allowedIncludes(BudgetUsageParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($budgetUsages->isEmpty()) {
            return response()->json([
                'message' => 'No budget usages found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new BudgetUsageCollection($budgetUsages);
    }

    /**
     * Store a newly created budget usage.
     */
    public function store(StoreBudgetUsageRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budgetUsage = BudgetUsage::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Budget usage created successfully',
                'data' => new BudgetUsageResource(
                    $budgetUsage->load(['costCenter', 'fiscalPeriod', 'creator', 'updater'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create budget usage',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified budget usage.
     */
    public function show(string $id): JsonResponse
    {
        $budgetUsage = QueryBuilder::for(BudgetUsage::class)
            ->allowedIncludes(BudgetUsageParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new BudgetUsageResource($budgetUsage)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified budget usage.
     */
    public function update(UpdateBudgetUsageRequest $request, BudgetUsage $budgetUsage): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budgetUsage->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Budget usage updated successfully',
                'data' => new BudgetUsageResource(
                    $budgetUsage->load(['costCenter', 'fiscalPeriod', 'creator', 'updater'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update budget usage',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified budget usage.
     */
    public function destroy(BudgetUsage $budgetUsage): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budgetUsage->delete();

            DB::commit();

            return response()->json([
                'message' => 'Budget usage deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete budget usage',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get budget usage statistics for a specific cost center.
     */
    public function costCenterStatistics(string $costCenterId): JsonResponse
    {
        $statistics = BudgetUsage::where('sub_cost_center', $costCenterId)
            ->select(
                DB::raw('SUM(sub_cost_center_approved_amount) as total_approved'),
                DB::raw('SUM(sub_cost_center_reserved_amount) as total_reserved'),
                DB::raw('SUM(sub_cost_center_consumed_amount) as total_consumed'),
                DB::raw('SUM(sub_cost_center_approved_amount - sub_cost_center_consumed_amount) as remaining_balance')
            )
            ->first();

        return response()->json([
            'data' => $statistics
        ], Response::HTTP_OK);
    }

    /**
     * Get budget usage statistics for a specific fiscal period.
     */
    public function fiscalPeriodStatistics(string $fiscalPeriodId): JsonResponse
    {
        $statistics = BudgetUsage::where('fiscal_period_id', $fiscalPeriodId)
            ->select(
                DB::raw('SUM(sub_cost_center_approved_amount) as total_approved'),
                DB::raw('SUM(sub_cost_center_reserved_amount) as total_reserved'),
                DB::raw('SUM(sub_cost_center_consumed_amount) as total_consumed'),
                DB::raw('SUM(sub_cost_center_approved_amount - sub_cost_center_consumed_amount) as remaining_balance')
            )
            ->first();

        return response()->json([
            'data' => $statistics
        ], Response::HTTP_OK);
    }
}
