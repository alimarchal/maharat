<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PaymentOrderApprovalTransaction\StorePaymentOrderApprovalTransactionRequest;
use App\Http\Requests\V1\PaymentOrderApprovalTransaction\UpdatePaymentOrderApprovalTransactionRequest;
use App\Http\Resources\V1\PaymentOrderApprovalTransactionResource;
use App\Models\PaymentOrderApprovalTransaction;
use App\QueryParameters\PaymentOrderApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentOrderApprovalTransactionController extends Controller
{
    /**
     * Display a listing of the payment order approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(PaymentOrderApprovalTransaction::class)
            ->allowedFilters(PaymentOrderApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(PaymentOrderApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(PaymentOrderApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No payment order approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PaymentOrderApprovalTransactionResource::collection($transactions);
    }

    /**
     * Store a newly created payment order approval transaction.
     */
    public function store(StorePaymentOrderApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = PaymentOrderApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Payment order approval transaction created successfully',
                'data' => new PaymentOrderApprovalTransactionResource(
                    $transaction->load([
                        'paymentOrder',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payment order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified payment order approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(PaymentOrderApprovalTransaction::class)
            ->allowedIncludes(PaymentOrderApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PaymentOrderApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified payment order approval transaction.
     */
    public function update(UpdatePaymentOrderApprovalTransactionRequest $request, PaymentOrderApprovalTransaction $paymentOrderApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as updater
            $data['updated_by'] = auth()->id();

            $paymentOrderApprovalTransaction->update($data);

            // If the status is 'Approve', check if this is the final approval
            if (isset($data['status']) && $data['status'] === 'Approve') {
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Payment Order Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $isFinalApproval = $paymentOrderApprovalTransaction->order == $totalRequiredApprovals;
                if (!$isFinalApproval) {
                    $nextOrder = $paymentOrderApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($nextStep) {
                        $nextApprover = DB::table('users')
                            ->join('process_step_user', 'users.id', '=', 'process_step_user.user_id')
                            ->where('process_step_user.process_step_id', $nextStep->id)
                            ->select('users.id')
                            ->first();
                        if ($nextApprover) {
                            $nextTransaction = new 
                                \App\Models\PaymentOrderApprovalTransaction([
                                    'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                                    'requester_id' => $paymentOrderApprovalTransaction->requester_id,
                                    'assigned_to' => $nextApprover->id,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => auth()->id(),
                                    'updated_by' => auth()->id()
                                ]);
                            $nextTransaction->save();
                            DB::table('tasks')->insert([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'assigned_to_user_id' => $nextApprover->id,
                                'assigned_from_user_id' => $paymentOrderApprovalTransaction->requester_id,
                                'read_status' => null,
                                'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Payment order approval transaction updated successfully',
                'data' => new PaymentOrderApprovalTransactionResource(
                    $paymentOrderApprovalTransaction->load([
                        'paymentOrder',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update payment order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified payment order approval transaction.
     */
    public function destroy(PaymentOrderApprovalTransaction $paymentOrderApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $paymentOrderApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payment order approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete payment order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
