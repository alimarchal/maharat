<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceItemRequest;
use App\Http\Requests\UpdateInvoiceItemRequest;
use App\Models\InvoiceItem;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class InvoiceItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Invoice $invoice)
    {
        try {
            $items = $invoice->items()
                ->select([
                    'id',
                    'name',
                    'description',
                    'quantity',
                    'unit_price',
                    'subtotal'
                ])
                ->get();
            
            Log::info('Fetched invoice items:', ['invoice_id' => $invoice->id, 'items_count' => $items->count()]);
            return response()->json(['data' => $items]);
        } catch (\Exception $e) {
            Log::error('Error fetching invoice items: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch invoice items',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInvoiceItemRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(InvoiceItem $invoiceItem)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(InvoiceItem $invoiceItem)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateInvoiceItemRequest $request, InvoiceItem $invoiceItem)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InvoiceItem $invoiceItem)
    {
        //
    }

    public function storeItems(Request $request, Invoice $invoice)
    {
        try {
            $validatedData = $request->validate([
                'items' => 'required|array',
                'items.*.item_name' => 'required|string',
                'items.*.description' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.subtotal' => 'required|numeric|min:0',
            ]);

            foreach ($validatedData['items'] as $item) {
                $invoice->items()->create([
                    'name' => $item['item_name'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['subtotal'],
                ]);
            }

            return response()->json(['message' => 'Items created successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateItems(Request $request, Invoice $invoice)
    {
        try {
            $validatedData = $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'nullable|exists:invoice_items,id',
                'items.*.item_name' => 'required|string',
                'items.*.description' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.subtotal' => 'required|numeric|min:0',
            ]);

            // Delete existing items not in the new list
            $newItemIds = collect($validatedData['items'])
                ->pluck('id')
                ->filter()
                ->toArray();
            
            $invoice->items()
                ->whereNotIn('id', $newItemIds)
                ->delete();

            // Update or create items
            foreach ($validatedData['items'] as $item) {
                $itemData = [
                    'name' => $item['item_name'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['subtotal'],
                ];

                if (isset($item['id'])) {
                    $invoice->items()
                        ->where('id', $item['id'])
                        ->update($itemData);
                } else {
                    $invoice->items()->create($itemData);
                }
            }

            return response()->json(['message' => 'Items updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
