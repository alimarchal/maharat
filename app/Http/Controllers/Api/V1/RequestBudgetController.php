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
                // Note: balance_amount will only be updated after the reallocation request is fully approved
                $data['old_balance'] = $sourceBudget->balance_amount;
                $data['destination_old_balance'] = $destinationBudget->balance_amount;

                Log::info('=== REALLOCATION REQUEST CREATED (BALANCES NOT YET UPDATED) ===', [
                    'source_old_balance' => $data['old_balance'],
                    'destination_old_balance' => $data['destination_old_balance'],
                    'reallocate_amount' => $data['reallocate_amount'],
                    'note' => 'Balance amounts will be updated only after full approval'
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
                    'source_old_requested_amount' => $sourceBudget->requested_amount,
                    'destination_old_requested_amount' => $destinationBudget->requested_amount,
                    'source_type' => 'budget_reallocation',
                    'purchase_order_id' => null,
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

            Log::info('=== REQUEST BUDGET UPDATE START ===', [
                'request_budget_id' => $requestBudget->id,
                'type' => $requestBudget->type,
                'has_reallocate_amount' => isset($data['reallocate_amount']),
                'reallocate_amount' => $data['reallocate_amount'] ?? null,
            ]);

            // If this is a reallocation request and reallocate_amount is being updated, update the history record
            if ($requestBudget->type === 'reallocation' && isset($data['reallocate_amount'])) {
                $historyRecord = \App\Models\BudgetReallocationHistory::where('reallocation_request_id', $requestBudget->id)->first();
                
                Log::info('=== CHECKING HISTORY RECORD ===', [
                    'reallocation_request_id' => $requestBudget->id,
                    'history_record_found' => $historyRecord !== null,
                    'history_record_id' => $historyRecord?->id,
                ]);
                
                if ($historyRecord) {
                    // Store old values before updating
                    $oldReallocateAmount = $historyRecord->reallocate_amount;
                    $oldSourceNewBalance = $historyRecord->source_new_balance;
                    $oldDestinationNewBalance = $historyRecord->destination_new_balance;
                    
                    // Calculate the difference in reallocate amount
                    $amountDifference = $data['reallocate_amount'] - $oldReallocateAmount;
                    
                    // Update the reallocate_amount in history
                    $historyRecord->reallocate_amount = $data['reallocate_amount'];
                    
                    // Update source_new_balance: decrease by the extra amount (taking more from source)
                    // source_new_balance = source_old_balance - new_reallocate_amount
                    // So we need to adjust: new_balance = old_balance - (old_reallocate_amount + difference)
                    // Which simplifies to: new_balance = old_new_balance - difference
                    $historyRecord->source_new_balance = $oldSourceNewBalance - $amountDifference;
                    
                    // Update destination_new_balance: increase by the extra amount (adding more to destination)
                    // destination_new_balance = destination_old_balance + new_reallocate_amount
                    // So we need to adjust: new_balance = old_balance + (old_reallocate_amount + difference)
                    // Which simplifies to: new_balance = old_new_balance + difference
                    $historyRecord->destination_new_balance = $oldDestinationNewBalance + $amountDifference;
                    
                    // Update notes if reason_for_increase is provided
                    if (isset($data['reason_for_increase'])) {
                        $historyRecord->notes = $data['reason_for_increase'];
                    }
                    
                    $historyRecord->updated_by = auth()->id();
                    $saveResult = $historyRecord->save();
                    
                    Log::info('=== REALLOCATION HISTORY UPDATED ===', [
                        'reallocation_request_id' => $requestBudget->id,
                        'history_record_id' => $historyRecord->id,
                        'old_reallocate_amount' => $oldReallocateAmount,
                        'new_reallocate_amount' => $data['reallocate_amount'],
                        'amount_difference' => $amountDifference,
                        'source_balance' => [
                            'old_new_balance' => $oldSourceNewBalance,
                            'new_new_balance' => $historyRecord->source_new_balance,
                            'old_balance' => $historyRecord->source_old_balance,
                        ],
                        'destination_balance' => [
                            'old_new_balance' => $oldDestinationNewBalance,
                            'new_new_balance' => $historyRecord->destination_new_balance,
                            'old_balance' => $historyRecord->destination_old_balance,
                        ],
                        'save_result' => $saveResult,
                        'updated_values' => $historyRecord->getDirty(),
                    ]);
                } else {
                    Log::warning('=== HISTORY RECORD NOT FOUND ===', [
                        'reallocation_request_id' => $requestBudget->id,
                        'message' => 'History record does not exist for this reallocation request. Attempting to create one.',
                    ]);
                    
                    // If history record doesn't exist, try to create it
                    // This can happen if the reallocation was created before history tracking was added
                    if ($requestBudget->sub_cost_center && $requestBudget->reallocate_to_sub_cost_center) {
                        // Find source and destination budgets
                        $sourceBudget = RequestBudget::where('fiscal_period_id', $requestBudget->fiscal_period_id)
                            ->where('department_id', $requestBudget->department_id)
                            ->where('cost_center_id', $requestBudget->cost_center_id)
                            ->where('sub_cost_center', $requestBudget->sub_cost_center)
                            ->where('status', 'Approved')
                            ->first();
                            
                        $destinationBudget = RequestBudget::where('fiscal_period_id', $requestBudget->fiscal_period_id)
                            ->where('department_id', $requestBudget->department_id)
                            ->where('cost_center_id', $requestBudget->cost_center_id)
                            ->where('sub_cost_center', $requestBudget->reallocate_to_sub_cost_center)
                            ->where('status', 'Approved')
                            ->first();
                            
                        if ($sourceBudget && $destinationBudget) {
                            $newHistoryRecord = \App\Models\BudgetReallocationHistory::create([
                                'reallocation_request_id' => $requestBudget->id,
                                'source_budget_request_id' => $sourceBudget->id,
                                'destination_budget_request_id' => $destinationBudget->id,
                                'reallocate_amount' => $data['reallocate_amount'],
                                'source_old_balance' => $sourceBudget->balance_amount ?? 0,
                                'source_new_balance' => $sourceBudget->balance_amount ?? 0,
                                'destination_old_balance' => $destinationBudget->balance_amount ?? 0,
                                'destination_new_balance' => $destinationBudget->balance_amount ?? 0,
                                'source_old_approved_amount' => $sourceBudget->approved_amount ?? null,
                                'destination_old_approved_amount' => $destinationBudget->approved_amount ?? null,
                                'source_old_requested_amount' => $sourceBudget->requested_amount ?? null,
                                'destination_old_requested_amount' => $destinationBudget->requested_amount ?? null,
                                'source_type' => 'budget_reallocation',
                                'purchase_order_id' => $requestBudget->purchase_order_id,
                                'status' => $requestBudget->status ?? 'Draft',
                                'notes' => $data['reason_for_increase'] ?? $requestBudget->reason_for_increase ?? null,
                                'created_by' => auth()->id(),
                                'updated_by' => auth()->id(),
                            ]);
                            
                            Log::info('=== HISTORY RECORD CREATED DURING UPDATE ===', [
                                'reallocation_request_id' => $requestBudget->id,
                                'history_record_id' => $newHistoryRecord->id,
                                'reallocate_amount' => $data['reallocate_amount'],
                            ]);
                        }
                    }
                }
            } else {
                Log::info('=== SKIPPING HISTORY UPDATE ===', [
                    'reallocation_request_id' => $requestBudget->id,
                    'type' => $requestBudget->type,
                    'is_reallocation' => $requestBudget->type === 'reallocation',
                    'has_reallocate_amount' => isset($data['reallocate_amount']),
                ]);
            }

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
            // If reallocate_to_sub_cost_center is null, this is the first update, so set original to the new destination
            if (!$requestBudget->original_destination_sub_cost_center) {
                $requestBudget->original_destination_sub_cost_center = $requestBudget->reallocate_to_sub_cost_center ?? $newDestinationId;
            }

            // Find source and destination budgets
            $sourceBudget = RequestBudget::where('fiscal_period_id', $requestBudget->fiscal_period_id)
                ->where('department_id', $requestBudget->department_id)
                ->where('cost_center_id', $requestBudget->cost_center_id)
                ->where('sub_cost_center', $requestBudget->sub_cost_center)
                ->where('status', 'Approved')
                ->first();

            if (!$sourceBudget) {
                return response()->json([
                    'success' => false,
                    'message' => 'Source budget request not found or not approved'
                ], Response::HTTP_BAD_REQUEST);
            }

            $destinationBudget = RequestBudget::where('fiscal_period_id', $requestBudget->fiscal_period_id)
                ->where('department_id', $requestBudget->department_id)
                ->where('cost_center_id', $requestBudget->cost_center_id)
                ->where('sub_cost_center', $newDestinationId)
                ->where('status', 'Approved')
                ->first();

            if (!$destinationBudget) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination budget request not found or not approved'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Update destination
            $requestBudget->reallocate_to_sub_cost_center = $newDestinationId;
            $requestBudget->updated_destination_sub_cost_center = $newDestinationId;
            $requestBudget->sub_cost_center_updated = true;
            $requestBudget->updated_by_user_id = auth()->id();
            
            // Store old balances before any updates
            $requestBudget->old_balance = $sourceBudget->balance_amount;
            $requestBudget->destination_old_balance = $destinationBudget->balance_amount;
            $requestBudget->save();

            // Create or update history record
            $historyRecord = \App\Models\BudgetReallocationHistory::where('reallocation_request_id', $requestBudget->id)->first();
            
            // Determine source type based on whether this is from purchase order
            $sourceType = $requestBudget->purchase_order_id ? 'purchase_order' : 'budget_reallocation';
            
            if (!$historyRecord) {
                // Create history record if it doesn't exist
                \App\Models\BudgetReallocationHistory::create([
                    'reallocation_request_id' => $requestBudget->id,
                    'source_budget_request_id' => $sourceBudget->id,
                    'destination_budget_request_id' => $destinationBudget->id,
                    'reallocate_amount' => $requestBudget->reallocate_amount ?? 0,
                    'source_old_balance' => $sourceBudget->balance_amount,
                    'source_new_balance' => $sourceBudget->balance_amount, // Will be updated when approved
                    'destination_old_balance' => $destinationBudget->balance_amount,
                    'destination_new_balance' => $destinationBudget->balance_amount, // Will be updated when approved
                    'source_old_approved_amount' => $sourceBudget->approved_amount,
                    'destination_old_approved_amount' => $destinationBudget->approved_amount,
                    'source_old_requested_amount' => $sourceBudget->requested_amount,
                    'destination_old_requested_amount' => $destinationBudget->requested_amount,
                    'source_type' => $sourceType,
                    'purchase_order_id' => $requestBudget->purchase_order_id,
                    'status' => $requestBudget->status ?? 'Draft',
                    'notes' => $requestBudget->reason_for_increase ?? null,
                    'created_by' => auth()->id(),
                ]);
            } else {
                // Update existing history record with new destination
                $historyRecord->destination_budget_request_id = $destinationBudget->id;
                $historyRecord->destination_old_balance = $destinationBudget->balance_amount;
                $historyRecord->destination_old_approved_amount = $destinationBudget->approved_amount;
                $historyRecord->destination_old_requested_amount = $destinationBudget->requested_amount;
                $historyRecord->source_old_requested_amount = $sourceBudget->requested_amount;
                $historyRecord->source_type = $sourceType;
                $historyRecord->purchase_order_id = $requestBudget->purchase_order_id;
                $historyRecord->updated_by = auth()->id();
                $historyRecord->save();
            }

            Log::info('=== REALLOCATION DESTINATION UPDATED ===', [
                'request_budget_id' => $requestBudget->id,
                'original_destination' => $requestBudget->original_destination_sub_cost_center,
                'new_destination' => $newDestinationId,
                'source_budget_id' => $sourceBudget->id,
                'destination_budget_id' => $destinationBudget->id,
                'history_created' => !$historyRecord,
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
