<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PaymentOrder\StorePaymentOrderRequest;
use App\Http\Requests\V1\PaymentOrder\UpdatePaymentOrderRequest;
use App\Http\Resources\V1\PaymentOrderResource;
use App\Models\PaymentOrder;
use App\QueryParameters\PaymentOrderParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentOrderController extends Controller
{
    /**
     * Generate a unique payment order number with format PO-XXXXX
     */
    private function generatePaymentOrderNumber(): string
    {
        $latestOrder = PaymentOrder::orderBy('id', 'desc')->first();
        $nextId = $latestOrder ? $latestOrder->id + 1 : 1;
        return 'PMT-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    public function index(): JsonResponse|ResourceCollection
    {
        $paymentOrders = QueryBuilder::for(PaymentOrder::class)
            ->allowedFilters(PaymentOrderParameters::ALLOWED_FILTERS)
            ->allowedSorts(PaymentOrderParameters::ALLOWED_SORTS)
            ->allowedIncludes(PaymentOrderParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($paymentOrders->isEmpty()) {
            return response()->json([
                'message' => 'No payment orders found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PaymentOrderResource::collection($paymentOrders);
    }

    public function store(StorePaymentOrderRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Set the authenticated user if user_id is not provided
            if (!isset($data['user_id'])) {
                $data['user_id'] = auth()->id();
            }

            // Generate unique payment order number
            $data['payment_order_number'] = $this->generatePaymentOrderNumber();

            $paymentOrder = PaymentOrder::create($data);

            DB::commit();

            // Load the relationships for the response
            $paymentOrder->load([
                'user',
                'purchaseOrder',
                'purchaseOrder.supplier',
                'purchaseOrder.quotation'
            ]);

            return response()->json([
                'message' => 'Payment order created successfully',
                'data' => new PaymentOrderResource($paymentOrder)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create payment order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $paymentOrder = QueryBuilder::for(PaymentOrder::class)
            ->allowedIncludes(PaymentOrderParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PaymentOrderResource($paymentOrder)
        ], Response::HTTP_OK);
    }

    public function update(UpdatePaymentOrderRequest $request, PaymentOrder $paymentOrder): JsonResponse
    {
        try {
            DB::beginTransaction();

            $paymentOrder->update($request->validated());

            DB::commit();

            // Load the relationships for the response
            $paymentOrder->load([
                'user',
                'purchaseOrder',
                'purchaseOrder.supplier',
                'purchaseOrder.quotation'
            ]);

            return response()->json([
                'message' => 'Payment order updated successfully',
                'data' => new PaymentOrderResource($paymentOrder)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update payment order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(PaymentOrder $paymentOrder): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete related logs first
            $paymentOrder->logs()->delete();

            // Delete the payment order
            $paymentOrder->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payment order deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete payment order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
