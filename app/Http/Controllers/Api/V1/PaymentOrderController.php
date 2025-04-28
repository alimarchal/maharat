<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PaymentOrder\StorePaymentOrderRequest;
use App\Http\Requests\V1\PaymentOrder\UpdatePaymentOrderRequest;
use App\Http\Resources\V1\PaymentOrderResource;
use App\Models\PaymentOrder;
use App\QueryParameters\PaymentOrderParameters;
use App\Services\PaymentOrderBudgetService;
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

    protected $budgetService;

    public function __construct(PaymentOrderBudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
    }
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

            $query = QueryBuilder::for(PaymentOrder::class)
                ->allowedFilters([
                    AllowedFilter::exact('status'),
                    AllowedFilter::exact('cost_center_id'),
                    AllowedFilter::exact('sub_cost_center_id'),
                    AllowedFilter::exact('purchase_order_id'),
                    AllowedFilter::exact('payment_order_number'),
                    AllowedFilter::callback('date', function ($query, $value) {
                        $dates = explode(',', $value);
                        if (count($dates) === 2) {
                            $query->whereBetween('date', [$dates[0], $dates[1]]);
                        }
                    }),
                    // Other filters
                ])
                ->allowedSorts(PaymentOrderParameters::ALLOWED_SORTS)
                ->allowedIncludes(PaymentOrderParameters::ALLOWED_INCLUDES)
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
//            Log::error('Payment Orders Error:', [
//                'message' => $e->getMessage(),
//                'trace' => $e->getTraceAsString()
//            ]);

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

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = 'payment_order_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('payment-orders', $filename, 'public');
                $data['attachment'] = $path;
            }

            $paymentOrder = PaymentOrder::create($data);

            // Consume budget if payment is for a purchase order
            if (isset($data['purchase_order_id'])) {
                if (!$this->budgetService->consumeBudget($paymentOrder, $data['amount'])) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Failed to consume budget, insufficient reserved amount',
                    ], Response::HTTP_BAD_REQUEST);
                }
            }

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

    /*
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

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $filename = 'payment_order_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('payment-orders', $filename, 'public');
                $data['attachment'] = $path;
            }

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

    */

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

    /**
     * Get raw payment order data directly from the database
     * This endpoint bypasses the PaymentOrderResource to include all fields
     *
     * @param string $id
     * @return JsonResponse
     */
    public function rawData(string $id): JsonResponse
    {
        try {
            $paymentOrder = PaymentOrder::with([
                'user',
                'purchaseOrder',
                'purchaseOrder.supplier',
                'purchaseOrder.quotation',
                'logs'
            ])->findOrFail($id);

            // Log the actual data being returned for debugging
            Log::info('Raw Payment Order Data', [
                'payment_order_id' => $id,
                'status' => $paymentOrder->status,
                'total_amount' => $paymentOrder->total_amount,
                'paid_amount' => $paymentOrder->paid_amount,
                'payment_type' => $paymentOrder->payment_type
            ]);

            // Return the model data directly without using the resource
            return response()->json([
                'data' => $paymentOrder
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error('Raw Payment Order Data Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get raw payment order data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Upload a document to the payment order
     */
    public function uploadDocument(Request $request, $id): JsonResponse
    {
        try {
            $paymentOrder = PaymentOrder::findOrFail($id);

            if (!$request->hasFile('payment_order_document')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No document provided'
                ], Response::HTTP_BAD_REQUEST);
            }

            $file = $request->file('payment_order_document');
            $filename = 'po_' . $paymentOrder->payment_order_number . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Store the document
            $path = $file->storeAs('payment-orders/documents', $filename, 'public');

            // Update the payment order with the uploaded document
            $paymentOrder->uploaded_attachment = $path;
            $paymentOrder->save();

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document_url' => '/storage/' . $path
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            \Log::error('Failed to upload document: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Save a generated PDF to the payment order's attachment column
     */
    public function saveAttachment(Request $request, $id): JsonResponse
    {
        try {
            $paymentOrder = PaymentOrder::findOrFail($id);

            if (!$request->hasFile('attachment')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No attachment provided'
                ], Response::HTTP_BAD_REQUEST);
            }

            $file = $request->file('attachment');
            $filename = 'payment_order_' . $paymentOrder->payment_order_number . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Store the document in a specific folder for payment order attachments
            $path = $file->storeAs('payment-orders/attachments', $filename, 'public');

            // Update the payment order's attachment field
            $paymentOrder->attachment = $path;
            $paymentOrder->save();

            return response()->json([
                'success' => true,
                'message' => 'Attachment saved successfully',
                'file_path' => $path
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            \Log::error('Failed to save attachment: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to save attachment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
