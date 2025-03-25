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
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Http\Request;

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
            ->allowedFilters([
                AllowedFilter::exact('status'),
                // Add other filters if needed
            ])
            ->allowedIncludes(['client', 'vendor'])
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|unique:invoices',
            'client_id' => 'required|exists:customers,id',
            'company_id' => 'required|exists:companies,id',
            'status' => 'required|in:Draft,Pending,Paid,Overdue,Cancelled',
            'payment_method' => 'nullable|string',
            'representative' => 'nullable|string',  
            'issue_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:issue_date',
            'vat_rate' => 'required|numeric|min:0', 
            'subtotal' => 'required|numeric',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric',  
            'total_amount' => 'required|numeric',
            'currency' => 'required|string|size:3',
        ]);

        try {
            $invoice = Invoice::create($validated);
            return new InvoiceResource($invoice);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $invoice = Invoice::with(['company', 'items' => function($query) {
                $query->select('id', 'invoice_id', 'name', 'description', 'quantity', 'unit_price', 'subtotal');
            }])->findOrFail($id);

            return response()->json([
                'data' => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'client_id' => $invoice->client_id,
                    'company_id' => $invoice->company_id,
                    'company' => $invoice->company,
                    'status' => $invoice->status,
                    'payment_method' => $invoice->payment_method,
                    'representative_id' => $invoice->representative_id,
                    'representative_email' => $invoice->representative_email,
                    'issue_date' => $invoice->issue_date,
                    'due_date' => $invoice->due_date,
                    'discounted_days' => $invoice->discounted_days,
                    'vat_rate' => $invoice->vat_rate,
                    'subtotal' => $invoice->subtotal,
                    'tax_amount' => $invoice->tax_amount,
                    'discount_amount' => $invoice->discount_amount,
                    'total_amount' => $invoice->total_amount,
                    'currency' => $invoice->currency,
                    'notes' => $invoice->notes,
                    'items' => $invoice->items->map(function($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->name,
                            'description' => $item->description,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'subtotal' => $item->subtotal
                        ];
                    })
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch invoice',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:customers,id',
            'company_id' => 'sometimes|exists:companies,id',
            'status' => 'sometimes|in:Draft,Pending,Paid,Overdue,Cancelled',
            'payment_method' => 'nullable|string',
            'representative' => 'nullable|string',  
            'issue_date' => 'sometimes|date',
            'due_date' => 'nullable|date|after_or_equal:issue_date',
            'vat_rate' => 'nullable|numeric|min:0',  
            'subtotal' => 'required|numeric',
            'tax_amount' => 'nullable|numeric',
            'discount_amount' => 'nullable|numeric', 
            'total_amount' => 'required|numeric',
            'currency' => 'nullable|string|size:3',
            'account_code_id' => 'required|exists:account_codes,id'
        ]);

        try {
            $invoice->update($validated);
            return new InvoiceResource($invoice);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], 500);
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
