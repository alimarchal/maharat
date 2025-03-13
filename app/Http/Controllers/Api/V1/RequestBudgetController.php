<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RequestBudget\StoreRequestBudgetRequest;
use App\Http\Requests\RequestBudget\UpdateRequestBudgetRequest;
use App\Http\Resources\RequestBudgetResource;
use App\Http\Resources\RequestBudgetCollection;
use App\Models\RequestBudget;
use App\QueryParameters\RequestBudgetParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class RequestBudgetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $requestBudgets = QueryBuilder::for(RequestBudget::class)
            ->allowedFilters(RequestBudgetParameters::ALLOWED_FILTERS)
            ->allowedSorts(RequestBudgetParameters::ALLOWED_SORTS)
            ->allowedIncludes(RequestBudgetParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($requestBudgets->isEmpty()) {
            return response()->json([
                'message' => 'No request budgets found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new RequestBudgetCollection($requestBudgets);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRequestBudgetRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['created_by'] = auth()->id();

            // Set default status if not provided
            if (!isset($data['status'])) {
                $data['status'] = 'Draft';
            }

            $requestBudget = RequestBudget::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Request budget created successfully',
                'data' => new RequestBudgetResource(
                    $requestBudget->load(['fiscalPeriod', 'department', 'costCenter', 'subCostCenter', 'creator'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create request budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $requestBudget = QueryBuilder::for(RequestBudget::class)
            ->allowedIncludes(RequestBudgetParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new RequestBudgetResource($requestBudget)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRequestBudgetRequest $request, RequestBudget $requestBudget): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['updated_by'] = auth()->id();

            $requestBudget->update($data);

            DB::commit();

            return response()->json([
                'message' => 'Request budget updated successfully',
                'data' => new RequestBudgetResource(
                    $requestBudget->load(['fiscalPeriod', 'department', 'costCenter', 'subCostCenter', 'creator', 'updater'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update request budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RequestBudget $requestBudget): JsonResponse
    {
        try {
            DB::beginTransaction();

            $requestBudget->delete();

            DB::commit();

            return response()->json([
                'message' => 'Request budget deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete request budget',
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

            $requestBudget = RequestBudget::withTrashed()->findOrFail($id);
            $requestBudget->restore();

            DB::commit();

            return response()->json([
                'message' => 'Request budget restored successfully',
                'data' => new RequestBudgetResource($requestBudget)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore request budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the status of a request budget.
     */
    public function updateStatus(UpdateRequestBudgetRequest $request, RequestBudget $requestBudget): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            if (!isset($data['status'])) {
                return response()->json([
                    'message' => 'Status field is required'
                ], Response::HTTP_BAD_REQUEST);
            }

            $data['updated_by'] = auth()->id();
            $requestBudget->update($data);

            DB::commit();

            return response()->json([
                'message' => 'Request budget status updated successfully',
                'data' => new RequestBudgetResource($requestBudget)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update request budget status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
