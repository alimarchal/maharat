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
