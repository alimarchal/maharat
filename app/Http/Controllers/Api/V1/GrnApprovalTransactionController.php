<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\GrnApprovalTransaction\StoreGrnApprovalTransactionRequest;
use App\Http\Requests\V1\GrnApprovalTransaction\UpdateGrnApprovalTransactionRequest;
use App\Http\Resources\V1\GrnApprovalTransactionResource;
use App\Models\GrnApprovalTransaction;
use App\QueryParameters\GrnApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class GrnApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(GrnApprovalTransaction::class)
            ->allowedFilters(GrnApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(GrnApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(GrnApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No GRN approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return GrnApprovalTransactionResource::collection($transactions);
    }

    public function store(StoreGrnApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = GrnApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'GRN approval transaction created successfully',
                'data' => new GrnApprovalTransactionResource(
                    $transaction->load([
                        'grn',
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
                'message' => 'Failed to create GRN approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(GrnApprovalTransaction::class)
            ->allowedIncludes(GrnApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new GrnApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateGrnApprovalTransactionRequest $request, GrnApprovalTransaction $grnApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating GRN approval transaction', [
                'transaction_id' => $grnApprovalTransaction->id,
                'grn_id' => $grnApprovalTransaction->grn_id,
                'new_status' => $validated['status'],
                'order' => $grnApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $grnApprovalTransaction->update($validated);

            // If the status is 'Approve' or 'Referred', check if this is the final approval
            if (in_array($validated['status'], ['Approve', 'Referred'])) {
                Log::info('=== GRN APPROVAL TRANSACTION CONTROLLER UPDATE CALLED ===', [
                    'transaction_id' => $grnApprovalTransaction->id,
                    'grn_id' => $grnApprovalTransaction->grn_id,
                    'assigned_to' => $grnApprovalTransaction->assigned_to,
                    'status' => $validated['status'],
                    'order' => $grnApprovalTransaction->order
                ]);
                
                // Check if this is a referral response task - if so, skip normal approval flow
                // Look for a task that was created as a result of a referral response
                $referralResponseTask = DB::table('tasks')
                    ->where('grn_id', $grnApprovalTransaction->grn_id)
                    ->where('assigned_to_user_id', $grnApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->first();
                
                Log::info('=== CHECKING FOR REFERRAL RESPONSE TASK ===', [
                    'grn_id' => $grnApprovalTransaction->grn_id,
                    'assigned_to' => $grnApprovalTransaction->assigned_to,
                    'referral_response_task_found' => $referralResponseTask ? true : false,
                    'referral_response_task_id' => $referralResponseTask ? $referralResponseTask->id : null,
                    'referral_response_task_assigned_from' => $referralResponseTask ? $referralResponseTask->assigned_from_user_id : null,
                    'referral_response_task_created_at' => $referralResponseTask ? $referralResponseTask->created_at : null
                ]);
                
                if ($referralResponseTask) {
                    Log::info('=== REFERRAL RESPONSE TASK DETECTED - SKIPPING NORMAL APPROVAL FLOW ===', [
                        'transaction_id' => $grnApprovalTransaction->id,
                        'grn_id' => $grnApprovalTransaction->grn_id,
                        'referral_response_task_id' => $referralResponseTask->id,
                        'note' => 'This is a referral response - normal approval flow will be handled by TaskController'
                    ]);
                } else {
                    // Normal approval flow - check if this is final approval
                    $processSteps = DB::table('process_steps')
                        ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                        ->where('processes.title', 'Short Delivery Adjustment Approval')
                        ->orderBy('process_steps.order')
                        ->get();

                    $totalRequiredApprovals = $processSteps->count();
                    $isFinalApproval = $grnApprovalTransaction->order == $totalRequiredApprovals;

                    Log::info('=== GRN FINAL APPROVAL CHECK ===', [
                        'transaction_id' => $grnApprovalTransaction->id,
                        'grn_id' => $grnApprovalTransaction->grn_id,
                        'current_order' => $grnApprovalTransaction->order,
                        'total_required_approvals' => $totalRequiredApprovals,
                        'is_final_approval' => $isFinalApproval
                    ]);

                    if ($isFinalApproval) {
                        Log::info('=== FINAL GRN APPROVAL - UPDATING GRN STATUS ===', [
                            'transaction_id' => $grnApprovalTransaction->id,
                            'grn_id' => $grnApprovalTransaction->grn_id,
                            'status' => $validated['status']
                        ]);
                        
                        // Update GRN task_status to Approved (final approval)
                        DB::table('grns')
                            ->where('id', $grnApprovalTransaction->grn_id)
                            ->update([
                                'task_status' => 'Approved',
                                'updated_at' => now()
                            ]);
                    } else {
                        // NOT final approval - create next approval step
                        Log::info('=== GRN NOT FINAL APPROVAL - CREATING NEXT STEP ===', [
                            'transaction_id' => $grnApprovalTransaction->id,
                            'grn_id' => $grnApprovalTransaction->grn_id,
                            'current_order' => $grnApprovalTransaction->order,
                            'total_required_approvals' => $totalRequiredApprovals,
                            'note' => 'Creating next approval step'
                        ]);

                        // Get the next process step
                        $nextOrder = $grnApprovalTransaction->order + 1;
                        $nextStep = $processSteps->where('order', $nextOrder)->first();

                        if ($nextStep) {
                            Log::info('=== FOUND NEXT GRN PROCESS STEP ===', [
                                'transaction_id' => $grnApprovalTransaction->id,
                                'grn_id' => $grnApprovalTransaction->grn_id,
                                'next_step_id' => $nextStep->id,
                                'next_step_order' => $nextStep->order,
                                'next_step_description' => $nextStep->description
                            ]);

                            // Get the approver for the next step
                            $resolver = new \App\Services\ApproverResolver();
                            $eloquentStep = \App\Models\ProcessStep::find($nextStep->id);
                            $requester = \App\Models\User::find($grnApprovalTransaction->requester_id);

                            if ($eloquentStep && $requester) {
                                $nextApproverId = null;
                                if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                                    $currentApprover = User::find($grnApprovalTransaction->assigned_to);
                                    // If current approver has no parent (is head), they approve their own requests
                                    $nextApproverId = $currentApprover?->parent_id ?: $currentApprover?->id;
                                } else {
                                    $nextApproverId = $resolver->resolveApproverId($eloquentStep, $requester);
                                }

                                if ($nextApproverId) {
                                    Log::info('=== FOUND NEXT GRN APPROVER ===', [
                                        'transaction_id' => $grnApprovalTransaction->id,
                                        'grn_id' => $grnApprovalTransaction->grn_id,
                                        'next_approver_id' => $nextApproverId,
                                        'next_step_order' => $nextStep->order
                                    ]);

                                    // Check if transaction already exists for this GRN and order
                                    $existingTransaction = DB::table('grn_approval_transactions')
                                        ->where('grn_id', $grnApprovalTransaction->grn_id)
                                        ->where('order', $nextOrder)
                                        ->where('assigned_to', $nextApproverId)
                                        ->first();

                                    if (!$existingTransaction) {
                                        // Create next approval transaction
                                        $nextApprovalTransactionId = DB::table('grn_approval_transactions')->insertGetId([
                                            'grn_id' => $grnApprovalTransaction->grn_id,
                                            'requester_id' => $grnApprovalTransaction->requester_id,
                                            'assigned_to' => $nextApproverId,
                                            'order' => $nextStep->order,
                                            'description' => $nextStep->description,
                                            'status' => 'Pending',
                                            'created_by' => auth()->id(),
                                            'updated_by' => auth()->id(),
                                            'created_at' => now(),
                                            'updated_at' => now()
                                        ]);

                                        Log::info('=== CREATED NEXT GRN APPROVAL TRANSACTION ===', [
                                            'transaction_id' => $grnApprovalTransaction->id,
                                            'grn_id' => $grnApprovalTransaction->grn_id,
                                            'next_approval_transaction_id' => $nextApprovalTransactionId,
                                            'next_approver_id' => $nextApproverId,
                                            'next_step_order' => $nextStep->order
                                        ]);

                                        // Check if task already exists for this GRN, process step, and assigned user
                                        $existingTask = DB::table('tasks')
                                            ->where('grn_id', $grnApprovalTransaction->grn_id)
                                            ->where('process_step_id', $nextStep->id)
                                            ->where('assigned_to_user_id', $nextApproverId)
                                            ->where('status', '!=', 'Completed')
                                            ->first();

                                        if (!$existingTask) {
                                            $nextTaskId = DB::table('tasks')->insertGetId([
                                                'process_step_id' => $nextStep->id,
                                                'process_id' => $nextStep->process_id,
                                                'assigned_at' => now(),
                                                'urgency' => 'Normal',
                                                'order_no' => $nextOrder,
                                                'assigned_to_user_id' => $nextApproverId,
                                                'assigned_from_user_id' => $grnApprovalTransaction->requester_id,
                                                'read_status' => null,
                                                'grn_id' => $grnApprovalTransaction->grn_id,
                                                'created_at' => now(),
                                                'updated_at' => now()
                                            ]);

                                            Log::info('=== CREATED NEXT GRN TASK ===', [
                                                'transaction_id' => $grnApprovalTransaction->id,
                                                'grn_id' => $grnApprovalTransaction->grn_id,
                                                'next_task_id' => $nextTaskId,
                                                'next_approver_id' => $nextApproverId,
                                                'next_step_order' => $nextStep->order
                                            ]);

                                            // Send task assignment notification
                                            $nextTask = \App\Models\Task::with(['assignedToUser', 'process'])->find($nextTaskId);
                                            if ($nextTask) {
                                                $nextTask->assignedToUser->notify(new \App\Notifications\TaskAssignmentNotification($nextTask, 'Short Delivery Adjustment Approval'));
                                                Log::info('=== NEXT GRN TASK ASSIGNMENT NOTIFICATION SENT ===', [
                                                    'transaction_id' => $grnApprovalTransaction->id,
                                                    'grn_id' => $grnApprovalTransaction->grn_id,
                                                    'next_task_id' => $nextTaskId,
                                                    'next_approver_id' => $nextApproverId
                                                ]);
                                            }
                                        } else {
                                            Log::info('=== GRN TASK ALREADY EXISTS, SKIPPING CREATION ===', [
                                                'transaction_id' => $grnApprovalTransaction->id,
                                                'grn_id' => $grnApprovalTransaction->grn_id,
                                                'process_step_id' => $nextStep->id,
                                                'assigned_to_user_id' => $nextApproverId
                                            ]);
                                        }
                                    } else {
                                        Log::info('=== GRN TRANSACTION ALREADY EXISTS, SKIPPING CREATION ===', [
                                            'transaction_id' => $grnApprovalTransaction->id,
                                            'grn_id' => $grnApprovalTransaction->grn_id,
                                            'order' => $nextOrder,
                                            'assigned_to' => $nextApproverId
                                        ]);
                                    }
                                } else {
                                    Log::error('=== FAILED TO FIND NEXT GRN APPROVER ===', [
                                        'transaction_id' => $grnApprovalTransaction->id,
                                        'grn_id' => $grnApprovalTransaction->grn_id,
                                        'next_step_id' => $nextStep->id,
                                        'next_step_order' => $nextStep->order
                                    ]);
                                }
                            } else {
                                Log::error('=== FAILED TO RESOLVE NEXT GRN APPROVER - MISSING STEP OR REQUESTER ===', [
                                    'transaction_id' => $grnApprovalTransaction->id,
                                    'grn_id' => $grnApprovalTransaction->grn_id,
                                    'eloquent_step_found' => $eloquentStep ? true : false,
                                    'requester_found' => $requester ? true : false
                                ]);
                            }
                        } else {
                            Log::warning('=== NO NEXT GRN PROCESS STEP FOUND ===', [
                                'transaction_id' => $grnApprovalTransaction->id,
                                'grn_id' => $grnApprovalTransaction->grn_id,
                                'current_order' => $grnApprovalTransaction->order,
                                'next_order' => $nextOrder,
                                'process_id' => $grnApprovalTransaction->process_id ?? 'unknown'
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'GRN approval transaction updated successfully',
                'data' => new GrnApprovalTransactionResource(
                    $grnApprovalTransaction->load([
                        'grn',
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
            Log::error('Failed to update GRN approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update GRN approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(GrnApprovalTransaction $grnApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grnApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'GRN approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete GRN approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}