<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MahratInvoiceApprovalTransaction\StoreMahratInvoiceApprovalTransactionRequest;
use App\Http\Requests\V1\MahratInvoiceApprovalTransaction\UpdateMahratInvoiceApprovalTransactionRequest;
use App\Http\Resources\V1\MahratInvoiceApprovalTransactionResource;
use App\Models\MahratInvoiceApprovalTransaction;
use App\Models\Invoice;
use App\QueryParameters\MahratInvoiceApprovalTransactionParameters;
use App\Services\BudgetRevenueUpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\QueryBuilder\QueryBuilder;

class MahratInvoiceApprovalTransactionController extends Controller
{
    /**
     * Display a listing of the mahrat invoice approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(MahratInvoiceApprovalTransaction::class)
            ->allowedFilters(MahratInvoiceApprovalTransactionParameters::getAllowedFilters())
            ->allowedSorts(MahratInvoiceApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(MahratInvoiceApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No mahrat invoice approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MahratInvoiceApprovalTransactionResource::collection($transactions);
    }


    /**
     * Store a newly created mahrat invoice approval transaction.
     */
    public function store(StoreMahratInvoiceApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = MahratInvoiceApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction created successfully',
                'data' => new MahratInvoiceApprovalTransactionResource(
                    $transaction->load([
                        'invoice',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified mahrat invoice approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $transaction = QueryBuilder::for(MahratInvoiceApprovalTransaction::class)
                ->allowedIncludes(MahratInvoiceApprovalTransactionParameters::ALLOWED_INCLUDES)
                ->with(['invoice']) // Ensure the invoice relationship is always loaded
                ->findOrFail($id);

            return response()->json([
                'data' => new MahratInvoiceApprovalTransactionResource($transaction)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch invoice details',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Update the specified mahrat invoice approval transaction.
     */
    public function update(UpdateMahratInvoiceApprovalTransactionRequest $request, MahratInvoiceApprovalTransaction $mahratInvoiceApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating Maharat Invoice approval transaction', [
                'transaction_id' => $mahratInvoiceApprovalTransaction->id,
                'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                'new_status' => $validated['status'],
                'order' => $mahratInvoiceApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $mahratInvoiceApprovalTransaction->update($validated);

            // If the status is 'Approve', check if this is the final approval
            if ($validated['status'] === 'Approve') {
                Log::info('Approval detected, checking if final approval', [
                    'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                    'current_status' => DB::table('invoices')->where('id', $mahratInvoiceApprovalTransaction->invoice_id)->value('status'),
                    'approval_order' => $mahratInvoiceApprovalTransaction->order
                ]);

                // Get total number of required approvals for this invoice
                $totalApprovals = DB::table('mahrat_invoice_approval_transactions')
                    ->where('invoice_id', $mahratInvoiceApprovalTransaction->invoice_id)
                    ->count();

                // Count how many approvals have been completed
                $completedApprovals = DB::table('mahrat_invoice_approval_transactions')
                    ->where('invoice_id', $mahratInvoiceApprovalTransaction->invoice_id)
                    ->where('status', 'Approve')
                    ->count();

                // Check if this is the final approval (all transactions are approved)
                $isFinalApproval = $completedApprovals === $totalApprovals;

                Log::info('Approval status check', [
                    'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                    'current_order' => $mahratInvoiceApprovalTransaction->order,
                    'total_approvals' => $totalApprovals,
                    'completed_approvals' => $completedApprovals,
                    'is_final_approval' => $isFinalApproval
                ]);

                // Only update invoice status if this is the final approval
                if ($isFinalApproval) {
                    Log::info('Final approval detected, updating Invoice status to Pending', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'approval_order' => $mahratInvoiceApprovalTransaction->order,
                        'total_approvals' => $totalApprovals,
                        'completed_approvals' => $completedApprovals
                    ]);

                    try {
                        // Create a new request to update the Invoice status
                        $statusUpdateRequest = new \Illuminate\Http\Request();
                        $statusUpdateRequest->merge(['status' => 'Pending']);

                        Log::info('Created status update request', [
                            'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                            'request_data' => $statusUpdateRequest->all()
                        ]);

                        // Use the Invoice controller to update the status
                        $invoiceController = new \App\Http\Controllers\Api\V1\InvoiceController();
                        
                        Log::info('Calling Invoice status update endpoint', [
                            'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                            'controller' => get_class($invoiceController)
                        ]);

                        $response = $invoiceController->updateStatus($statusUpdateRequest, $mahratInvoiceApprovalTransaction->invoice_id);

                        Log::info('Invoice status update response received', [
                            'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                            'response_status' => $response->status(),
                            'response_content' => $response->getContent()
                        ]);

                        // Verify the status was actually updated
                        $updatedInvoice = Invoice::find($mahratInvoiceApprovalTransaction->invoice_id);
                        Log::info('Invoice status after update', [
                            'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                            'current_status' => $updatedInvoice->status,
                            'expected_status' => 'Pending'
                        ]);

                        // Update budget revenue after invoice is approved
                        if ($updatedInvoice && $updatedInvoice->status === 'Pending') {
                            Log::info('Updating budget revenue for approved invoice', [
                                'invoice_id' => $updatedInvoice->id,
                                'invoice_amount' => $updatedInvoice->total_amount,
                                'invoice_date' => $updatedInvoice->issue_date
                            ]);

                            $budgetService = new BudgetRevenueUpdateService();
                            $budgetUpdateResult = $budgetService->updateBudgetRevenue($updatedInvoice);

                            if ($budgetUpdateResult['success']) {
                                Log::info('Budget revenue updated successfully', [
                                    'invoice_id' => $updatedInvoice->id,
                                    'message' => $budgetUpdateResult['message'],
                                    'budgets_updated' => $budgetUpdateResult['budgets_updated']
                                ]);

                                // Update accounts after successful budget update
                                Log::info('=== UPDATING ACCOUNTS FOR APPROVED INVOICE ===', [
                                    'invoice_id' => $updatedInvoice->id,
                                    'total_amount' => $updatedInvoice->total_amount,
                                    'tax_amount' => $updatedInvoice->tax_amount
                                ]);

                                // Update Revenue/Income account (ID 4)
                                $revenueAccountUpdated = DB::table('accounts')
                                    ->where('id', 4)
                                    ->where('name', 'Revenue/Income')
                                    ->update([
                                        'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $updatedInvoice->total_amount),
                                        'updated_at' => now()
                                    ]);

                                Log::info('=== REVENUE ACCOUNT UPDATE RESULT ===', [
                                    'invoice_id' => $updatedInvoice->id,
                                    'account_id' => 4,
                                    'account_name' => 'Revenue/Income',
                                    'amount_added' => $updatedInvoice->total_amount,
                                    'update_success' => $revenueAccountUpdated
                                ]);

                                // Update VAT Collected account (ID 9)
                                $vatAccountUpdated = DB::table('accounts')
                                    ->where('id', 9)
                                    ->where('name', 'VAT Collected (on Maharat invoices)')
                                    ->update([
                                        'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $updatedInvoice->tax_amount),
                                        'updated_at' => now()
                                    ]);

                                Log::info('=== VAT ACCOUNT UPDATE RESULT ===', [
                                    'invoice_id' => $updatedInvoice->id,
                                    'account_id' => 9,
                                    'account_name' => 'VAT Collected (on Maharat invoices)',
                                    'amount_added' => $updatedInvoice->tax_amount,
                                    'update_success' => $vatAccountUpdated
                                ]);

                                if ($revenueAccountUpdated && $vatAccountUpdated) {
                                    Log::info('=== ALL ACCOUNT UPDATES COMPLETED SUCCESSFULLY ===', [
                                        'invoice_id' => $updatedInvoice->id,
                                        'revenue_account_updated' => $revenueAccountUpdated,
                                        'vat_account_updated' => $vatAccountUpdated
                                    ]);
                                } else {
                                    Log::warning('=== SOME ACCOUNT UPDATES FAILED ===', [
                                        'invoice_id' => $updatedInvoice->id,
                                        'revenue_account_updated' => $revenueAccountUpdated,
                                        'vat_account_updated' => $vatAccountUpdated
                                    ]);
                                }
                            } else {
                                Log::warning('Budget revenue update failed', [
                                    'invoice_id' => $updatedInvoice->id,
                                    'message' => $budgetUpdateResult['message']
                                ]);
                            }
                        }

                    } catch (\Exception $e) {
                        Log::error('Failed to update Invoice status', [
                            'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                } else {
                    Log::info('Not final approval yet', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'current_order' => $mahratInvoiceApprovalTransaction->order,
                        'total_approvals' => $totalApprovals,
                        'completed_approvals' => $completedApprovals
                    ]);
                }
            } elseif ($validated['status'] === 'Reject') {
                // If rejected, immediately update invoice status to Cancelled
                Log::info('Rejection detected, updating Invoice status to Cancelled', [
                    'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                    'approval_order' => $mahratInvoiceApprovalTransaction->order
                ]);

                try {
                    // Create a new request to update the Invoice status
                    $statusUpdateRequest = new \Illuminate\Http\Request();
                    $statusUpdateRequest->merge(['status' => 'Cancelled']);

                    Log::info('Created rejection status update request', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'request_data' => $statusUpdateRequest->all()
                    ]);

                    // Use the Invoice controller to update the status
                    $invoiceController = new \App\Http\Controllers\Api\V1\InvoiceController();
                    
                    Log::info('Calling Invoice status update endpoint for rejection', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'controller' => get_class($invoiceController)
                    ]);

                    $response = $invoiceController->updateStatus($statusUpdateRequest, $mahratInvoiceApprovalTransaction->invoice_id);

                    Log::info('Invoice rejection status update response received', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'response_status' => $response->status(),
                        'response_content' => $response->getContent()
                    ]);

                    // Verify the status was actually updated
                    $updatedInvoice = Invoice::find($mahratInvoiceApprovalTransaction->invoice_id);
                    Log::info('Invoice status after rejection update', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'current_status' => $updatedInvoice->status,
                        'expected_status' => 'Cancelled'
                    ]);

                } catch (\Exception $e) {
                    Log::error('Failed to update Invoice status for rejection', [
                        'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } else {
                Log::info('Not an approval or rejection status', [
                    'status' => $validated['status'],
                    'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Maharat invoice approval transaction updated successfully',
                'data' => new MahratInvoiceApprovalTransactionResource(
                    $mahratInvoiceApprovalTransaction->load([
                        'invoice',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update Maharat invoice approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update Maharat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified mahrat invoice approval transaction.
     */
    public function destroy(MahratInvoiceApprovalTransaction $mahratInvoiceApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $mahratInvoiceApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
