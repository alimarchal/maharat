<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RfqApprovalTransaction\StoreRfqApprovalTransactionRequest;
use App\Http\Requests\V1\RfqApprovalTransaction\UpdateRfqApprovalTransactionRequest;
use App\Http\Resources\V1\RfqApprovalTransactionResource;
use App\Models\RfqApprovalTransaction;
use App\QueryParameters\RfqApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\Rfq;

class RfqApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(RfqApprovalTransaction::class)
            ->allowedFilters(RfqApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(RfqApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(RfqApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No RFQ approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return RfqApprovalTransactionResource::collection($transactions);
    }

    public function store(StoreRfqApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = RfqApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'RFQ approval transaction created successfully',
                'data' => new RfqApprovalTransactionResource(
                    $transaction->load([
                        'rfq',
                        'requester',
                        'assignedTo',
                        'referredTo',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create RFQ approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(RfqApprovalTransaction::class)
            ->allowedIncludes(RfqApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new RfqApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateRfqApprovalTransactionRequest $request, RfqApprovalTransaction $rfqApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating RFQ approval transaction', [
                'transaction_id' => $rfqApprovalTransaction->id,
                'rfq_id' => $rfqApprovalTransaction->rfq_id,
                'new_status' => $validated['status'],
                'order' => $rfqApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $rfqApprovalTransaction->update($validated);

            // If the status is 'Approve', check if this is the final approval
            if ($validated['status'] === 'Approve') {
                Log::info('Approval detected, checking if final approval', [
                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                    'current_status' => DB::table('rfqs')->where('id', $rfqApprovalTransaction->rfq_id)->value('status_id'),
                    'approval_order' => $rfqApprovalTransaction->order
                ]);

                // Get total number of required approvals for this RFQ
                $totalApprovals = DB::table('rfq_approval_transactions')
                    ->where('rfq_id', $rfqApprovalTransaction->rfq_id)
                    ->count();

                // Check if this is the final approval
                $isFinalApproval = $rfqApprovalTransaction->order === $totalApprovals;

                Log::info('Approval status check', [
                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                    'current_order' => $rfqApprovalTransaction->order,
                    'total_approvals' => $totalApprovals,
                    'is_final_approval' => $isFinalApproval
                ]);

                // Only update RFQ status if this is the final approval
                if ($isFinalApproval) {
                    Log::info('Final approval detected, updating RFQ status to Active', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'approval_order' => $rfqApprovalTransaction->order,
                        'total_approvals' => $totalApprovals
                    ]);

                    try {
                        // Create a new request to update the RFQ status
                        $statusUpdateRequest = new \Illuminate\Http\Request();
                        $statusUpdateRequest->merge(['status_id' => 47]);

                        Log::info('Created status update request', [
                            'rfq_id' => $rfqApprovalTransaction->rfq_id,
                            'request_data' => $statusUpdateRequest->all()
                        ]);

                        // Use the RFQ controller to update the status
                        $rfqController = new \App\Http\Controllers\Api\V1\RfqController();
                        
                        Log::info('Calling RFQ status update endpoint', [
                            'rfq_id' => $rfqApprovalTransaction->rfq_id,
                            'controller' => get_class($rfqController)
                        ]);

                        $response = $rfqController->updateStatus($statusUpdateRequest, $rfqApprovalTransaction->rfq_id);

                        Log::info('RFQ status update response received', [
                            'rfq_id' => $rfqApprovalTransaction->rfq_id,
                            'response_status' => $response->status(),
                            'response_content' => $response->getContent()
                        ]);

                        // Verify the status was actually updated
                        $updatedRfq = Rfq::find($rfqApprovalTransaction->rfq_id);
                        Log::info('RFQ status after update', [
                            'rfq_id' => $rfqApprovalTransaction->rfq_id,
                            'current_status_id' => $updatedRfq->status_id,
                            'expected_status_id' => 47
                        ]);

                    } catch (\Exception $e) {
                        Log::error('Failed to update RFQ status', [
                            'rfq_id' => $rfqApprovalTransaction->rfq_id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                } else {
                    Log::info('Not final approval yet', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'current_order' => $rfqApprovalTransaction->order,
                        'total_approvals' => $totalApprovals
                    ]);
                }
            } elseif ($validated['status'] === 'Reject') {
                // If rejected, immediately update RFQ status to Rejected (49)
                Log::info('Rejection detected, updating RFQ status to Rejected', [
                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                    'approval_order' => $rfqApprovalTransaction->order
                ]);

                try {
                    // Create a new request to update the RFQ status
                    $statusUpdateRequest = new \Illuminate\Http\Request();
                    $statusUpdateRequest->merge(['status_id' => 49]);

                    Log::info('Created rejection status update request', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'request_data' => $statusUpdateRequest->all()
                    ]);

                    // Use the RFQ controller to update the status
                    $rfqController = new \App\Http\Controllers\Api\V1\RfqController();
                    
                    Log::info('Calling RFQ status update endpoint for rejection', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'controller' => get_class($rfqController)
                    ]);

                    $response = $rfqController->updateStatus($statusUpdateRequest, $rfqApprovalTransaction->rfq_id);

                    Log::info('RFQ rejection status update response received', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'response_status' => $response->status(),
                        'response_content' => $response->getContent()
                    ]);

                    // Verify the status was actually updated
                    $updatedRfq = Rfq::find($rfqApprovalTransaction->rfq_id);
                    Log::info('RFQ status after rejection update', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'current_status_id' => $updatedRfq->status_id,
                        'expected_status_id' => 49
                    ]);

                } catch (\Exception $e) {
                    Log::error('Failed to update RFQ status for rejection', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } else {
                Log::info('Not an approval or rejection status', [
                    'status' => $validated['status'],
                    'rfq_id' => $rfqApprovalTransaction->rfq_id
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'RFQ approval transaction updated successfully',
                'data' => new RfqApprovalTransactionResource(
                    $rfqApprovalTransaction->load([
                        'rfq',
                        'requester',
                        'assignedTo',
                        'referredTo',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update RFQ approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update RFQ approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(RfqApprovalTransaction $rfqApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $rfqApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'RFQ approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete RFQ approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
