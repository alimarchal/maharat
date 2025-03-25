<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Invoice\StoreInvoiceRequest;
use App\Http\Requests\V1\Invoice\UpdateInvoiceRequest;
use App\Http\Resources\V1\InvoiceResource;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\QueryParameters\InvoiceParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceController extends Controller
{
    /**
     * Generate a unique invoice number with format INV-XXXXX
     */
    private function generateInvoiceNumber(): string
    {
        $latestInvoice = Invoice::orderBy('id', 'desc')->first();
        $nextId = $latestInvoice ? $latestInvoice->id + 1 : 1;
        return 'INV-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate line item totals
     */
    private function calculateItemTotals(array $item): array
    {
        $quantity = $item['quantity'];
        $unitPrice = $item['unit_price'];
        $taxRate = $item['tax_rate'];

        $subtotal = $quantity * $unitPrice;
        $taxAmount = $subtotal * ($taxRate / 100);
        $total = $subtotal + $taxAmount;

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total
        ];
    }

    /**
     * Calculate invoice totals based on items
     */
    private function calculateInvoiceTotals(array $items): array
    {
        $subtotal = 0;
        $taxAmount = 0;
        $totalAmount = 0;

        foreach ($items as $item) {
            $calculatedItem = $this->calculateItemTotals($item);
            $subtotal += $calculatedItem['subtotal'];
            $taxAmount += $calculatedItem['tax_amount'];
            $totalAmount += $calculatedItem['total'];
        }

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount
        ];
    }

    public function index(): JsonResponse|ResourceCollection
    {
        $invoices = QueryBuilder::for(Invoice::class)
            ->allowedFilters(InvoiceParameters::ALLOWED_FILTERS)
            ->allowedSorts(InvoiceParameters::ALLOWED_SORTS)
            ->allowedIncludes(InvoiceParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($invoices->isEmpty()) {
            return response()->json([
                'message' => 'No invoices found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return InvoiceResource::collection($invoices);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get validated data
            $validatedData = $request->validated();

            // Ensure numeric fields are properly cast
            $numericFields = ['total_amount', 'subtotal', 'tax_amount',  'client_id'];
            foreach ($numericFields as $field) {
                if (isset($validatedData[$field])) {
                    $validatedData[$field] = is_string($validatedData[$field])
                        ? (float) $validatedData[$field]
                        : $validatedData[$field];
                }
            }

            // Add invoice number
            $validatedData['invoice_number'] = $this->generateInvoiceNumber();

            // Create invoice
            $invoice = Invoice::create($validatedData);

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'data' => new InvoiceResource($invoice->fresh())
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Invoice creation error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $invoice = QueryBuilder::for(Invoice::class)
            ->allowedIncludes(InvoiceParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new InvoiceResource($invoice)
        ], Response::HTTP_OK);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get validated data
            $validatedData = $request->validated();

            // Ensure numeric fields are properly cast
            $numericFields = ['total_amount', 'subtotal', 'tax_amount', 'client_id'];
            foreach ($numericFields as $field) {
                if (isset($validatedData[$field])) {
                    $validatedData[$field] = is_string($validatedData[$field])
                        ? (float) $validatedData[$field]
                        : $validatedData[$field];
                }
            }

            // Update invoice
            $invoice->update($validatedData);

            DB::commit();

            return response()->json([
                'message' => 'Invoice updated successfully',
                'data' => new InvoiceResource($invoice->fresh())
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Invoice update error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            $invoice->delete();

            DB::commit();

            return response()->json([
                'message' => 'Invoice deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function restore(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::withTrashed()->findOrFail($id);
            $invoice->restore();

            DB::commit();

            return response()->json([
                'message' => 'Invoice restored successfully',
                'data' => new InvoiceResource($invoice->load('client', 'items'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getPaymentMethods()
    {
        try {
            // You can modify this array based on your requirements
            $paymentMethods = ['Cash', 'Credit', 'Bank Transfer', 'Cheque'];

            return response()->json([
                'success' => true,
                'payment_methods' => $paymentMethods
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment methods',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getNextInvoiceNumber()
    {
        try {
            $nextInvoiceNumber = $this->generateInvoiceNumber();

            return response()->json([
                'success' => true,
                'next_number' => $nextInvoiceNumber
            ]);
        } catch (\Exception $e) {
            \Log::error('Error generating next invoice number: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate next invoice number',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
