<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PoApprovalTransaction\StorePoApprovalTransactionRequest;
use App\Http\Requests\V1\PoApprovalTransaction\UpdatePoApprovalTransactionRequest;
use App\Http\Resources\V1\PoApprovalTransactionResource;
use App\Models\PoApprovalTransaction;
use App\QueryParameters\PoApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class PoApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(PoApprovalTransaction::class)
            ->allowedFilters(PoApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedFilters(
                PoApprovalTransactionParameters::ALLOWED_FILTERS_EXACT
            )
            ->allowedSorts(PoApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(PoApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No purchase order approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PoApprovalTransactionResource::collection($transactions);
    }

    public function store(StorePoApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = PoApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction created successfully',
                'data' => new PoApprovalTransactionResource(
                    $transaction->load([
                        'purchaseOrder',
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
                'message' => 'Failed to create purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(PoApprovalTransaction::class)
            ->allowedIncludes(PoApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PoApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdatePoApprovalTransactionRequest $request, PoApprovalTransaction $poApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $poApprovalTransaction->update($validated);

            // If the status is 'Approve', check if this is the final approval
            if (isset($validated['status']) && $validated['status'] === 'Approve') {
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Purchase Order Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $isFinalApproval = $poApprovalTransaction->order == $totalRequiredApprovals;
                if (!$isFinalApproval) {
                    $nextOrder = $poApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($nextStep) {
                        $nextApprover = DB::table('users')
                            ->join('process_step_user', 'users.id', '=', 'process_step_user.user_id')
                            ->where('process_step_user.process_step_id', $nextStep->id)
                            ->select('users.id')
                            ->first();
                        if ($nextApprover) {
                            $nextTransaction = new 
                                \App\Models\PoApprovalTransaction([
                                    'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                    'requester_id' => $poApprovalTransaction->requester_id,
                                    'assigned_to' => $nextApprover->id,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => Auth::id(),
                                    'updated_by' => Auth::id()
                                ]);
                            $nextTransaction->save();
                            DB::table('tasks')->insert([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'assigned_to_user_id' => $nextApprover->id,
                                'assigned_from_user_id' => $poApprovalTransaction->requester_id,
                                'read_status' => null,
                                'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction updated successfully',
                'data' => new PoApprovalTransactionResource(
                    $poApprovalTransaction->load([
                        'purchaseOrder',
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
            return response()->json([
                'message' => 'Failed to update purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(PoApprovalTransaction $poApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $poApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
