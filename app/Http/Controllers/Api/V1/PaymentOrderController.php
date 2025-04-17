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
     * Upload a document for a payment order and save it in the attachment field
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function uploadDocument(Request $request, $id): JsonResponse
    {
        try {
            // Log the incoming request
            Log::info('Upload Document Request', [
                'payment_order_id' => $id,
                'has_file' => $request->hasFile('payment_document'),
                'all_files' => $request->allFiles(),
            ]);

            // Validate the request
            $request->validate([
                'payment_document' => 'required|file|mimes:pdf|max:10240', // 10MB limit
            ]);

            // Find the payment order
            $paymentOrder = PaymentOrder::findOrFail($id);
            Log::info('Payment Order Found', ['payment_order' => $paymentOrder->payment_order_number]);

            // Handle file upload
            if ($request->hasFile('payment_document')) {
                $file = $request->file('payment_document');
                $fileName = 'payment_order_' . $paymentOrder->payment_order_number . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                Log::info('Uploading file', [
                    'original_name' => $file->getClientOriginalName(),
                    'new_filename' => $fileName,
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
                
                // Create uploads directory if it doesn't exist
                $uploadsPath = public_path('uploads');
                if (!file_exists($uploadsPath)) {
                    mkdir($uploadsPath, 0755, true);
                }
                
                // Store the file
                $file->move($uploadsPath, $fileName);
                
                // Update the payment order with the attachment filename
                $paymentOrder->update([
                    'attachment' => $fileName
                ]);

                Log::info('File uploaded successfully', ['filename' => $fileName]);

                return response()->json([
                    'success' => true,
                    'message' => 'Document uploaded successfully',
                    'document_url' => '/uploads/' . $fileName
                ], Response::HTTP_OK);
            }

            Log::warning('No file was uploaded');
            return response()->json([
                'success' => false,
                'message' => 'No file was uploaded'
            ], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            Log::error('Upload Document Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
