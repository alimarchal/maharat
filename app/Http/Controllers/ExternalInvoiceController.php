<?php

namespace App\Http\Controllers;

use App\Models\ExternalInvoice;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ExternalInvoiceController extends Controller
{
    public function getAvailablePurchaseOrders()
    {
        try {
            \Log::info('Starting getAvailablePurchaseOrders');
            
            $purchaseOrders = DB::select("
                SELECT p.id, p.purchase_order_no 
                FROM purchase_orders p 
                LEFT JOIN external_invoices ei ON p.id = ei.purchase_order_id 
                WHERE ei.id IS NULL
            ");

            \Log::info('Query result:', [
                'count' => count($purchaseOrders),
                'data' => $purchaseOrders
            ]);

            return response()->json([
                'success' => true,
                'data' => array_map(function($po) {
                    return [
                        'id' => $po->id,
                        'purchase_order_no' => $po->purchase_order_no
                    ];
                }, $purchaseOrders)
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'invoice_id' => 'required|string|max:255',
                'supplier_id' => 'required|exists:suppliers,id',
                'amount' => 'required|numeric|min:0',
                'status' => 'required|string|in:pending,paid,overdue',
                'payable_date' => 'required|date',
                'purchase_order_id' => 'required|exists:purchase_orders,id'
            ]);

            $invoice = new ExternalInvoice();
            $invoice->invoice_id = $validated['invoice_id'];
            $invoice->supplier_id = $validated['supplier_id'];
            $invoice->amount = $validated['amount'];
            $invoice->status = $validated['status'];
            $invoice->payable_date = $validated['payable_date'];
            $invoice->purchase_order_id = $validated['purchase_order_id'];
            $invoice->user_id = auth()->id();
            $invoice->save();

            return response()->json([
                'success' => true,
                'message' => 'Invoice created successfully',
                'data' => $invoice->load('supplier', 'purchaseOrder')
            ]);
        } catch (\Exception $e) {
            \Log::error('Error creating invoice: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $invoice = ExternalInvoice::findOrFail($id);

            $validated = $request->validate([
                'invoice_id' => 'required|string|max:255',
                'supplier_id' => 'required|exists:suppliers,id',
                'amount' => 'required|numeric|min:0',
                'status' => 'required|string|in:pending,paid,overdue',
                'payable_date' => 'required|date',
                'purchase_order_id' => 'required|exists:purchase_orders,id'
            ]);

            $invoice->invoice_id = $validated['invoice_id'];
            $invoice->supplier_id = $validated['supplier_id'];
            $invoice->amount = $validated['amount'];
            $invoice->status = $validated['status'];
            $invoice->payable_date = $validated['payable_date'];
            $invoice->purchase_order_id = $validated['purchase_order_id'];
            $invoice->save();

            return response()->json([
                'success' => true,
                'message' => 'Invoice updated successfully',
                'data' => $invoice->load('supplier', 'purchaseOrder')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        try {
            \Log::info('Fetching external invoices...');
            
            $invoices = ExternalInvoice::with(['purchaseOrder', 'supplier'])
                ->orderBy('created_at', 'desc')
                ->get();

            \Log::info('External invoices data:', [
                'count' => $invoices->count(),
                'data' => $invoices->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $invoices
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching external invoices: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch external invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 