<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ExternalInvoice\StoreExternalInvoiceRequest;
use App\Http\Requests\V1\ExternalInvoice\UpdateExternalInvoiceRequest;
use App\Http\Resources\V1\ExternalInvoiceResource;
use App\Models\ExternalInvoice;
use App\QueryParameters\ExternalInvoiceParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class ExternalInvoiceController extends Controller
{
    /**
     * Display a listing of the external invoices.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $invoices = QueryBuilder::for(ExternalInvoice::class)
            ->allowedFilters(ExternalInvoiceParameters::ALLOWED_FILTERS)
            ->allowedSorts(ExternalInvoiceParameters::ALLOWED_SORTS)
            ->allowedIncludes(ExternalInvoiceParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($invoices->isEmpty()) {
            return response()->json([
                'message' => 'No external invoices found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return ExternalInvoiceResource::collection($invoices);
    }

    /**
     * Store a newly created external invoice in storage.
     */
    public function store(StoreExternalInvoiceRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            
            // Set default values
            $data['invoice_id'] = $this->generateInvoiceId();
            $data['type'] = $data['type'] ?? 'Cash';
            
            // Always calculate VAT as 15% of the amount
            $data['vat_amount'] = $data['amount'] * 0.15;

            // Create the invoice
            $invoice = ExternalInvoice::create($data);

            DB::commit();

            return response()->json([
                'message' => 'External invoice created successfully',
                'data' => new ExternalInvoiceResource(
                    $invoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified external invoice.
     */
    public function show(string $id): JsonResponse
    {
        $invoice = QueryBuilder::for(ExternalInvoice::class)
            ->allowedIncludes(ExternalInvoiceParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ExternalInvoiceResource($invoice)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified external invoice in storage.
     */
    public function update(UpdateExternalInvoiceRequest $request, ExternalInvoice $externalInvoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            
            // Always calculate VAT as 15% of the amount
            if (isset($data['amount'])) {
                $data['vat_amount'] = $data['amount'] * 0.15;
            }

            $externalInvoice->update($data);

            DB::commit();

            return response()->json([
                'message' => 'External invoice updated successfully',
                'data' => new ExternalInvoiceResource(
                    $externalInvoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified external invoice from storage.
     */
    public function destroy(ExternalInvoice $externalInvoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Use forceDelete for hard delete
            $externalInvoice->forceDelete();

            DB::commit();

            return response()->json([
                'message' => 'External invoice deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function generateInvoiceId(): string
    {
        $prefix = 'EXT-INV-';
        $lastInvoice = ExternalInvoice::orderBy('id', 'desc')->first();
        
        if (!$lastInvoice) {
            return $prefix . '0001';
        }

        $lastNumber = 0;
        if (preg_match('/-(\d+)$/', $lastInvoice->invoice_id, $matches)) {
            $lastNumber = intval($matches[1]);
        }
        
        $nextNumber = $lastNumber + 1;
        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get purchase orders that don't have external invoices.
     */
    public function getAvailablePurchaseOrders()
    {
        try {
            \Log::info('Starting getAvailablePurchaseOrders');
            
            // Execute raw SQL query without model dependency
            $purchaseOrders = DB::select("
                SELECT p.id, p.purchase_order_no 
                FROM purchase_orders p 
                LEFT JOIN external_invoices ei ON p.id = ei.purchase_order_id 
                WHERE ei.id IS NULL
                ORDER BY p.id DESC
            ");

            if (!$purchaseOrders) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            \Log::info('Query result:', [
                'count' => count($purchaseOrders),
                'data' => $purchaseOrders
            ]);

            return response()->json([
                'success' => true,
                'data' => $purchaseOrders
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getAvailablePurchaseOrders:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available purchase orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
