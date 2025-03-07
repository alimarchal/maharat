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
            $invoiceData = $request->safe()->except('items');
            $itemsData = $request->safe()->only('items')['items'];

            // Calculate totals
            $totals = $this->calculateInvoiceTotals($itemsData);

            // Create invoice with auto-generated invoice number
            $invoiceData['invoice_number'] = $this->generateInvoiceNumber();
            $invoiceData['subtotal'] = $totals['subtotal'];
            $invoiceData['tax_amount'] = $totals['tax_amount'];
            $invoiceData['total_amount'] = $totals['total_amount'];

            $invoice = Invoice::create($invoiceData);

            // Create invoice items
            foreach ($itemsData as $item) {
                $calculatedItem = $this->calculateItemTotals($item);

                $invoice->items()->create([
                    'name' => $item['name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $calculatedItem['tax_amount'],
                    'subtotal' => $calculatedItem['subtotal'],
                    'total' => $calculatedItem['total'],
                    'identification' => $item['identification'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'data' => new InvoiceResource($invoice->load('vendor', 'client', 'items'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

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

            // Update invoice data if provided
            $invoiceData = $request->safe()->except('items');
            if (!empty($invoiceData)) {
                $invoice->update($invoiceData);
            }

            // Update or create items if provided
            if ($request->has('items')) {
                $itemsData = $request->safe()->only('items')['items'];
                $existingItemIds = [];

                foreach ($itemsData as $item) {
                    $calculatedItem = $this->calculateItemTotals($item);

                    $itemData = [
                        'name' => $item['name'],
                        'description' => $item['description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $item['tax_rate'],
                        'tax_amount' => $calculatedItem['tax_amount'],
                        'subtotal' => $calculatedItem['subtotal'],
                        'total' => $calculatedItem['total'],
                        'identification' => $item['identification'] ?? null,
                    ];

                    // Update existing item or create new one
                    if (isset($item['id'])) {
                        $invoiceItem = $invoice->items()->findOrFail($item['id']);
                        $invoiceItem->update($itemData);
                        $existingItemIds[] = $item['id'];
                    } else {
                        $newItem = $invoice->items()->create($itemData);
                        $existingItemIds[] = $newItem->id;
                    }
                }

                // Delete items not included in the update
                $invoice->items()->whereNotIn('id', $existingItemIds)->delete();

                // Recalculate invoice totals
                $items = $invoice->items()->get();
                $subtotal = $items->sum('subtotal');
                $taxAmount = $items->sum('tax_amount');
                $totalAmount = $items->sum('total');

                $invoice->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoice updated successfully',
                'data' => new InvoiceResource($invoice->load('vendor', 'client', 'items'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

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
                'data' => new InvoiceResource($invoice->load('vendor', 'client', 'items'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
