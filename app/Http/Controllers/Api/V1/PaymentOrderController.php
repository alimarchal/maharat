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
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    public function index(Request $request)
    {
        try {
            Log::info('Payment Orders Request:', [
                'request' => $request->all(),
                'url' => $request->fullUrl()
            ]);

            $query = QueryBuilder::for(PaymentOrder::class)
                ->allowedFilters([
                    AllowedFilter::exact('status'),
                    AllowedFilter::exact('cost_center_id'),
                    AllowedFilter::exact('sub_cost_center_id'),
                ])
                ->allowedIncludes([
                    'user',
                    'purchaseOrder',
                    'purchaseOrder.supplier',
                    'purchaseOrder.quotation',
                    'logs'
                ])
                ->defaultSort('-created_at');

            $perPage = $request->input('per_page', 10);
            $paymentOrders = $query->paginate($perPage);

            return response()->json([
                'data' => $paymentOrders->items(),
                'meta' => [
                    'current_page' => $paymentOrders->currentPage(),
                    'last_page' => $paymentOrders->lastPage(),
                    'per_page' => $paymentOrders->perPage(),
                    'total' => $paymentOrders->total()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Payment Orders Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to fetch payment orders',
                'message' => $e->getMessage()
            ], 500);
        }
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
