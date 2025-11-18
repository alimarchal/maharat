<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RequestBudget\StoreRequestBudgetRequest;
use App\Http\Requests\RequestBudget\UpdateRequestBudgetRequest;
use App\Http\Resources\RequestBudgetResource;
use App\Http\Resources\RequestBudgetCollection;
use App\Models\RequestBudget;
use App\Models\BudgetReallocationHistory;
use App\QueryParameters\RequestBudgetParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            Log::info('=== REQUEST BUDGET STORE STARTED ===', [
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'ip' => $request->ip(),
                'url' => $request->fullUrl()
            ]);

            DB::beginTransaction();

            $data = $request->validated();
            Log::info('Request data validated successfully', [
                'validated_data' => $data
            ]);

            $data['created_by'] = auth()->id();
            Log::info('Authenticated user ID set', [
                'created_by' => $data['created_by']
            ]);

            // Set default status if not provided
            if (!isset($data['status'])) {
                $data['status'] = 'Draft';
            }

            // Set default type if not provided
            if (!isset($data['type'])) {
                $data['type'] = 'budget_request';
            }

            // Handle reallocation logic
            $sourceBudget = null;
            $destinationBudget = null;
            
            if (isset($data['type']) && $data['type'] === 'reallocation') {
                Log::info('=== PROCESSING REALLOCATION ===', [
                    'source_sub_cost_center' => $data['sub_cost_center'],
                    'destination_sub_cost_center' => $data['reallocate_to_sub_cost_center'] ?? null,
                    'reallocate_amount' => $data['reallocate_amount'] ?? null
                ]);

                // Find source approved budget request
                $sourceBudget = RequestBudget::where('fiscal_period_id', $data['fiscal_period_id'])
                    ->where('department_id', $data['department_id'])
                    ->where('cost_center_id', $data['cost_center_id'])
                    ->where('sub_cost_center', $data['sub_cost_center'])
                    ->where('status', 'Approved')
                    ->first();

                if (!$sourceBudget) {
                    throw new \Exception('Source budget request not found or not approved');
                }

                // Find destination approved budget request
                $destinationBudget = RequestBudget::where('fiscal_period_id', $data['fiscal_period_id'])
                    ->where('department_id', $data['department_id'])
                    ->where('cost_center_id', $data['cost_center_id'])
                    ->where('sub_cost_center', $data['reallocate_to_sub_cost_center'])
                    ->where('status', 'Approved')
                    ->first();

                if (!$destinationBudget) {
                    throw new \Exception('Destination budget request not found or not approved');
                }

                // Store old balances in the reallocation record (not on source/destination records)
                // This preserves history even if multiple reallocations are made
                $data['old_balance'] = $sourceBudget->balance_amount;
                $data['destination_old_balance'] = $destinationBudget->balance_amount;

                // Update source budget: balance_amount = balance_amount - reallocate_amount
                // Note: We don't update old_balance on source/destination records to preserve history
                $sourceBudget->balance_amount = $sourceBudget->balance_amount - $data['reallocate_amount'];
                $sourceBudget->save();

                // Update destination budget: balance_amount = balance_amount + reallocate_amount
                $destinationBudget->balance_amount = $destinationBudget->balance_amount + $data['reallocate_amount'];
                $destinationBudget->save();

                Log::info('=== REALLOCATION BALANCES UPDATED ===', [
                    'source_old_balance' => $data['old_balance'],
                    'source_new_balance' => $sourceBudget->balance_amount,
                    'destination_old_balance' => $data['destination_old_balance'],
                    'destination_new_balance' => $destinationBudget->balance_amount
                ]);
            }

            $requestBudget = RequestBudget::create($data);

            // Create history record for reallocation
            if (isset($data['type']) && $data['type'] === 'reallocation' && $sourceBudget && $destinationBudget) {
                BudgetReallocationHistory::create([
                    'reallocation_request_id' => $requestBudget->id,
                    'source_budget_request_id' => $sourceBudget->id,
                    'destination_budget_request_id' => $destinationBudget->id,
                    'reallocate_amount' => $data['reallocate_amount'],
                    'source_old_balance' => $data['old_balance'],
                    'source_new_balance' => $sourceBudget->balance_amount,
                    'destination_old_balance' => $data['destination_old_balance'],
                    'destination_new_balance' => $destinationBudget->balance_amount,
                    'source_old_approved_amount' => $sourceBudget->approved_amount,
                    'destination_old_approved_amount' => $destinationBudget->approved_amount,
                    'status' => 'Draft',
                    'notes' => $data['reason_for_increase'] ?? null,
                    'created_by' => auth()->id(),
                ]);

                Log::info('=== REALLOCATION HISTORY RECORD CREATED ===', [
                    'reallocation_request_id' => $requestBudget->id,
                    'source_budget_request_id' => $sourceBudget->id,
                    'destination_budget_request_id' => $destinationBudget->id
                ]);
            }
            Log::info('Request budget created in database', [
                'request_budget_id' => $requestBudget->id,
                'status' => $requestBudget->status,
                'type' => $requestBudget->type
            ]);

            DB::commit();

            Log::info('=== REQUEST BUDGET CREATED SUCCESSFULLY ===', [
                'request_budget_id' => $requestBudget->id,
                'user_id' => auth()->id(),
                'type' => $requestBudget->type
            ]);

            return response()->json([
                'message' => 'Request budget created successfully',
                'data' => new RequestBudgetResource(
                    $requestBudget->load(['fiscalPeriod', 'department', 'costCenter', 'subCostCenter', 'reallocateToSubCostCenter', 'creator'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('=== REQUEST BUDGET CREATION FAILED ===', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
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

            // Delete associated tasks
            \App\Models\Task::where('request_budgets_id', $requestBudget->id)->delete();
            
            // Delete associated budget request approval transactions
            \App\Models\BudgetRequestApprovalTransaction::where('request_budgets_id', $requestBudget->id)->delete();
            
            // Delete the budget request
            $requestBudget->delete();

            DB::commit();

            return response()->json([
                'message' => 'Request budget and associated data deleted successfully'
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

    /**
     * Update destination sub cost center for reallocation request
     */
    public function updateDestination(Request $request, RequestBudget $requestBudget): JsonResponse
    {
        try {
            // Check if this is a reallocation request
            if ($requestBudget->type !== 'reallocation') {
                return response()->json([
                    'success' => false,
                    'message' => 'This is not a reallocation request'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Check if destination has already been updated
            if ($requestBudget->sub_cost_center_updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination sub cost center has already been updated by a previous approver'
                ], Response::HTTP_BAD_REQUEST);
            }

            $newDestinationId = $request->input('new_destination_sub_cost_center_id');
            if (!$newDestinationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'New destination sub cost center ID is required'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Validate that the new destination is in the available alternatives
            $availableAlternatives = json_decode($requestBudget->available_alternatives_json, true) ?? [];
            $isValidAlternative = false;
            foreach ($availableAlternatives as $alt) {
                if (($alt['sub_cost_center_id'] ?? null) == $newDestinationId) {
                    $isValidAlternative = true;
                    break;
                }
            }

            if (!$isValidAlternative) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected destination is not in the available alternatives'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Store original destination if not already stored
            if (!$requestBudget->original_destination_sub_cost_center) {
                $requestBudget->original_destination_sub_cost_center = $requestBudget->reallocate_to_sub_cost_center;
            }

            // Update destination
            $requestBudget->reallocate_to_sub_cost_center = $newDestinationId;
            $requestBudget->updated_destination_sub_cost_center = $newDestinationId;
            $requestBudget->sub_cost_center_updated = true;
            $requestBudget->updated_by_user_id = auth()->id();
            $requestBudget->save();

            Log::info('=== REALLOCATION DESTINATION UPDATED ===', [
                'request_budget_id' => $requestBudget->id,
                'original_destination' => $requestBudget->original_destination_sub_cost_center,
                'new_destination' => $newDestinationId,
                'updated_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Destination sub cost center updated successfully',
                'data' => new RequestBudgetResource($requestBudget->fresh())
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            Log::error('Error updating reallocation destination: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update destination: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
