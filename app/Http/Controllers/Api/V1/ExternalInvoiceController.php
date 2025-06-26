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
use Illuminate\Support\Facades\Schema;
use App\Services\TransactionFlowService;

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
            $data['status'] = 'UnPaid'; // Always set to UnPaid on creation
            
            // Handle file upload if present
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('invoices', $fileName, 'public');
                
                $data['attachment_path'] = $filePath;
                $data['original_name'] = $file->getClientOriginalName();
            }

            // Create the invoice
            $invoice = ExternalInvoice::create($data);

            // Update account ID 2 with credit_amount = credit_amount + (amount + vat_amount)
            $totalAmount = $data['amount'] + $data['vat_amount'];
            
            // Log the account update for debugging
            \Log::info('Updating account ID 2', [
                'invoice_id' => $invoice->id,
                'amount' => $data['amount'],
                'vat_amount' => $data['vat_amount'],
                'total_amount' => $totalAmount
            ]);
            
            $accountUpdate = DB::table('accounts')
                ->where('id', 2)
                ->increment('credit_amount', $totalAmount);
                
            \Log::info('Account update result', [
                'rows_affected' => $accountUpdate,
                'account_id' => 2
            ]);

            TransactionFlowService::recordTransactionFlow(
                2, // account_id
                'credit',
                $totalAmount,
                'external_invoice',
                $invoice->id,
                [],
                'External invoice created',
                $invoice->invoice_id,
                now()->toDateString(),
                $invoice->attachment_path,
                $invoice->original_name
            );

            DB::commit();

            return response()->json([
                'message' => 'External invoice created successfully',
                'data' => new ExternalInvoiceResource(
                    $invoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create external invoice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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
            
            // Store old amounts for account adjustment
            $oldAmount = $externalInvoice->amount;
            $oldVatAmount = $externalInvoice->vat_amount;
            
            // Handle file upload if present
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('invoices', $fileName, 'public');
                
                $data['attachment_path'] = $filePath;
                $data['original_name'] = $file->getClientOriginalName();
            }

            $externalInvoice->update($data);

            // Update account ID 2 if amounts changed
            if (isset($data['amount']) || isset($data['vat_amount'])) {
                $newAmount = $data['amount'] ?? $externalInvoice->amount;
                $newVatAmount = $data['vat_amount'] ?? $externalInvoice->vat_amount;
                
                $oldTotal = $oldAmount + $oldVatAmount;
                $newTotal = $newAmount + $newVatAmount;
                $difference = $newTotal - $oldTotal;
                
                if ($difference != 0) {
                    \Log::info('Updating account ID 2 on invoice update', [
                        'invoice_id' => $externalInvoice->id,
                        'old_total' => $oldTotal,
                        'new_total' => $newTotal,
                        'difference' => $difference
                    ]);
                    
                    DB::table('accounts')
                        ->where('id', 2)
                        ->increment('credit_amount', $difference);
                    TransactionFlowService::recordTransactionFlow(
                        2,
                        $difference > 0 ? 'credit' : 'debit',
                        abs($difference),
                        'external_invoice',
                        $externalInvoice->id,
                        [],
                        'External invoice updated',
                        $externalInvoice->invoice_id,
                        now()->toDateString(),
                        $externalInvoice->attachment_path,
                        $externalInvoice->original_name
                    );
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'External invoice updated successfully',
                'data' => new ExternalInvoiceResource(
                    $externalInvoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to update external invoice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
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

            // Store amounts for account adjustment
            $amount = $externalInvoice->amount;
            $vatAmount = $externalInvoice->vat_amount;
            $totalAmount = $amount + $vatAmount;

            // Use forceDelete for hard delete
            $externalInvoice->forceDelete();

            // Update account ID 2 by subtracting the total amount
            DB::table('accounts')
                ->where('id', 2)
                ->decrement('credit_amount', $totalAmount);

            TransactionFlowService::recordTransactionFlow(
                2,
                'debit',
                $totalAmount,
                'external_invoice',
                $externalInvoice->id,
                [],
                'External invoice deleted',
                $externalInvoice->invoice_id,
                now()->toDateString(),
                $externalInvoice->attachment_path,
                $externalInvoice->original_name
            );

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
            
            // Check if purchase_orders table exists
            if (!Schema::hasTable('purchase_orders')) {
                \Log::warning('purchase_orders table does not exist');
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
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
            
            // Return empty data instead of error
            return response()->json([
                'success' => true,
                'data' => [],
                'debug_error' => $e->getMessage()
            ]);
        }
    }
}
