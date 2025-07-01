<?php

namespace App\Http\Controllers;

use App\Http\Requests\V1\Account\StoreAccountRequest;
use App\Http\Requests\V1\Account\StoreLedgerRequest;
use App\Http\Requests\V1\Account\UpdateAccountRequest;
use App\Http\Resources\V1\AccountResource;
use App\Http\Resources\V1\LedgerResource;
use App\Models\Account;
use App\Models\Ledger;
use App\Models\Invoice;
use App\QueryParameters\AccountParameters;
use App\Services\AccountBalancingService;
use App\Services\TransactionFlowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\QueryBuilder\QueryBuilder;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $ledgers = QueryBuilder::for(Account::class)
            ->allowedFilters(AccountParameters::ALLOWED_FILTERS)
            ->allowedSorts(AccountParameters::ALLOWED_SORTS)
            ->allowedIncludes(AccountParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($ledgers->isEmpty()) {
            return response()->json([
                'message' => 'No account found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return AccountResource::collection($ledgers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAccountRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ledger = Account::create($request->validated());

            // Handle transaction flow if this is a cash account with credit amount
            if ($ledger->id == 12 && $ledger->name === 'Cash' && 
                $request->has('credit_amount') && 
                $request->credit_amount > 0) {
                
                // For new accounts, the transaction amount is the full credit_amount
                $transactionAmount = $request->credit_amount;
                $this->handleCashTransactionFlow($ledger, $request, $transactionAmount);
            }

            DB::commit();

            return response()->json([
                'message' => 'Account created successfully',
                'data' => new AccountResource($ledger->load(['costCenter', 'creator', 'updater']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create accounts',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $ledger = QueryBuilder::for(Account::class)
            ->allowedIncludes(AccountParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new AccountResource($ledger)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAccountRequest $request, Account $account): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Store original values for comparison
            $originalCreditAmount = $account->credit_amount;
            $originalDebitAmount = $account->debit_amount;

            // Special handling for Account ID 2 (Liabilities) - validate BEFORE updating
            if ($account->id == 2 && $account->name === 'Accounts Payable' && 
                $request->has('debit_amount') && 
                $request->debit_amount > 0) {
                $this->validateLiabilitiesAccountUpdate($request);
            }

            // Update the account (but handle special cases)
            $data = $request->validated();
            
            // For Liabilities account (ID 2), don't update credit_amount
            if ($account->id == 2 && $account->name === 'Accounts Payable') {
                // Remove credit_amount from data to prevent it from being updated
                unset($data['credit_amount']);
            }
            
            // For Cash account (ID 12), don't update credit_amount directly
            if ($account->id == 12 && $account->name === 'Cash') {
                unset($data['credit_amount']);
            }
            
            // For Asset account (ID 1), increment credit or debit amount instead of overwriting
            if ($account->id == 1) {
                if (isset($data['credit_amount']) && $data['credit_amount'] !== null && $data['credit_amount'] !== "") {
                    $increment = floatval($data['credit_amount']);
                    $data['credit_amount'] = $account->credit_amount + $increment;
                    \App\Services\TransactionFlowService::recordTransactionFlow(
                        $account->id,
                        'credit',
                        $increment,
                        'account_update',
                        $account->id,
                        [],
                        'Asset account credited',
                        null,
                        now()->toDateString(),
                        $data['attachment'] ?? null,
                        $data['original_name'] ?? null
                    );
                }
                if (isset($data['debit_amount']) && $data['debit_amount'] !== null && $data['debit_amount'] !== "") {
                    $increment = floatval($data['debit_amount']);
                    $data['debit_amount'] = $account->debit_amount + $increment;
                    \App\Services\TransactionFlowService::recordTransactionFlow(
                        $account->id,
                        'debit',
                        $increment,
                        'account_update',
                        $account->id,
                        [],
                        'Asset account debited',
                        null,
                        now()->toDateString(),
                        $data['attachment'] ?? null,
                        $data['original_name'] ?? null
                    );
                }
            }
            
            $account->update($data);

            // Special handling for Account ID 2 (Liabilities) - handle debit operations
            if ($account->id == 2 && $account->name === 'Accounts Payable' && 
                $request->has('debit_amount') && 
                $request->debit_amount > 0) {
                
                $this->handleLiabilitiesAccountUpdate($request, $account, $originalCreditAmount);
            }

            // Check if this is the Cash account (ID 12) and if credit_amount is being set
            if ($account->id == 12 && $account->name === 'Cash' && 
                $request->has('credit_amount') && 
                $request->credit_amount > 0) {
                
                // Calculate the transaction amount (difference from original)
                $transactionAmount = $request->credit_amount - $originalCreditAmount;
                
                // Only process if there's an actual transaction (amount changed)
                if ($transactionAmount != 0) {
                    // Handle transaction flow for cash credit (this includes balancing)
                    $this->handleCashTransactionFlow($account, $request, $transactionAmount);
                }
            }

            // Check if this is the VAT Collected account (ID 9) and if credit_amount is being increased
            if ($account->id == 9 && $account->name === 'VAT Collected (on Maharat invoices)' && 
                $request->has('credit_amount') && 
                $request->credit_amount > 0) {
                
                $creditAmount = $request->credit_amount;
                
                // Use the AccountBalancingService to handle VAT balancing
                $vatBalancingResults = AccountBalancingService::handleVatCollectedBalancing(
                    $account->id, 
                    $creditAmount, 
                    $originalCreditAmount
                );
                
                // Log the results
                if ($vatBalancingResults['vat_receivables_updated']) {
                    Log::info('=== VAT BALANCING COMPLETED ===', [
                        'account_id' => $account->id,
                        'account_name' => $account->name,
                        'balancing_results' => $vatBalancingResults
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Account updated successfully',
                'data' => new AccountResource($account->load(['costCenter', 'creator', 'updater']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Validate Liabilities account update before processing
     */
    private function validateLiabilitiesAccountUpdate(Request $request): void
    {
        $data = $request->validated();
        
        // For Liabilities account, only allow debit operations (reducing liabilities)
        if (isset($data['credit_amount']) && $data['credit_amount'] > 0) {
            throw new \Exception('Cannot credit Liabilities account. Only debit operations are allowed.');
        }

        // Check if debit amount is provided
        if (!isset($data['debit_amount']) || $data['debit_amount'] <= 0) {
            throw new \Exception('Debit amount is required and must be greater than 0 for Liabilities account.');
        }

        // Validate invoice number exists in external_invoices table
        if (!isset($data['invoice_number']) || empty($data['invoice_number'])) {
            throw new \Exception('Invoice number is required for Liabilities account debit operations.');
        }

        // Check if invoice exists in external_invoices table
        $invoice = \App\Models\ExternalInvoice::where('invoice_id', $data['invoice_number'])->first();
        if (!$invoice) {
            throw new \Exception('Invoice number not found in external_invoices table.');
        }

        $debitAmount = $data['debit_amount'];
        $total = $invoice->amount + $invoice->vat_amount;
        $proportion = $debitAmount / $total;
        $basePaid = round($invoice->amount * $proportion, 2);
        $vatPaid = round($invoice->vat_amount * $proportion, 2);
        $totalDebitAmount = $basePaid + $vatPaid;

        // Validate that paid_amount + totalDebitAmount <= amount + vat_amount
        $invoiceTotal = $invoice->amount + $invoice->vat_amount;
        $newPaidAmount = $invoice->paid_amount + $totalDebitAmount;
        if ($newPaidAmount > $invoiceTotal) {
            throw new \Exception('Amount exceeds invoice payable amount. Payment would exceed invoice total.');
        }
    }

    /**
     * Handle special update logic for Liabilities account (ID 2)
     */
    private function handleLiabilitiesAccountUpdate(Request $request, Account $account, float $originalCreditAmount): void
    {
        $data = $request->validated();
        
        $debitAmount = $data['debit_amount'];
        $invoice = \App\Models\ExternalInvoice::where('invoice_id', $data['invoice_number'])->first();
        if (!$invoice) {
            throw new \Exception('Invoice number not found in external_invoices table.');
        }
        $total = $invoice->amount + $invoice->vat_amount;
        $proportion = $debitAmount / $total;
        $basePaid = round($invoice->amount * $proportion, 2);
        $vatPaid = round($invoice->vat_amount * $proportion, 2);
        $totalDebitAmount = $basePaid + $vatPaid;

        // Update paid_amount and status
        $invoice->paid_amount = $invoice->paid_amount + $totalDebitAmount;
        $invoiceTotal = $invoice->amount + $invoice->vat_amount;
        if ($invoice->paid_amount < $invoiceTotal) {
            $invoice->status = 'Partially Paid';
        } else {
            $invoice->status = 'Paid';
        }
        $invoice->save();

        // Update the account with the total debit amount (only debit_amount, not credit_amount)
        $account->update([
            'debit_amount' => $totalDebitAmount,
            'invoice_number' => $data['invoice_number'],
            'attachment' => $data['attachment'] ?? null,
            'original_name' => $data['original_name'] ?? null,
        ]);

        // Record transaction flow
        TransactionFlowService::recordTransactionFlow(
            2, // account_id
            'debit',
            $totalDebitAmount,
            'liabilities_payment',
            $invoice->id,
            [],
            "Liabilities payment for invoice {$data['invoice_number']} (Amount: {$debitAmount}, Tax: {$vatPaid})",
            $data['invoice_number'],
            now()->toDateString(),
            $data['attachment'] ?? null,
            $data['original_name'] ?? null
        );

        // Recalculate total debits for the account and update the field
        $totalDebits = \App\Services\TransactionFlowService::sumDebitsForAccount($account->id);
        $account->update([
            'debit_amount' => $totalDebits,
        ]);

        Log::info('=== LIABILITIES ACCOUNT DEBIT COMPLETED ===', [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'debit_amount' => $debitAmount,
            'vat_amount' => $vatPaid,
            'total_debit_amount' => $totalDebitAmount,
            'invoice_number' => $data['invoice_number'],
            'invoice_id' => $invoice->id,
            'new_total_debit_amount' => $totalDebits
        ]);
    }

    /**
     * Handle cash transaction flow and invoice paid_amount updates
     */
    private function handleCashTransactionFlow(Account $account, Request $request, float $transactionAmount): void
    {
        try {
            Log::info('=== HANDLE CASH TRANSACTION FLOW STARTED ===', [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'transaction_amount' => $transactionAmount
            ]);

            $invoiceNumber = $request->input('invoice_number');
            $attachment = $request->input('attachment');
            $originalName = $request->input('original_name');
            $description = $request->input('description', 'Cash credit transaction');

            Log::info('=== CASH TRANSACTION FLOW PARAMETERS ===', [
                'transaction_amount' => $transactionAmount,
                'invoice_number' => $invoiceNumber,
                'attachment' => $attachment,
                'original_name' => $originalName,
                'description' => $description
            ]);

            // Only allow transaction if invoice/payment reference is provided
            if ($invoiceNumber) {
                Log::info('=== UPDATING INVOICE PAID AMOUNT ===', [
                    'invoice_number' => $invoiceNumber,
                    'transaction_amount' => $transactionAmount
                ]);
                $this->updateReferencePaidAmount($invoiceNumber, $transactionAmount);

                // Record transaction flow (should update account balances)
                Log::info('=== CALLING TRANSACTION FLOW SERVICE ===', [
                    'method' => 'recordCashTransactionFlows'
                ]);

                TransactionFlowService::recordCashTransactionFlows(
                    $transactionAmount,
                    $description,
                    $invoiceNumber,
                    $attachment,
                    $originalName
                );
            } else {
                Log::warning('Cash credit attempted without reference number. Transaction not recorded.', [
                    'account_id' => $account->id,
                    'transaction_amount' => $transactionAmount
                ]);
                // Do nothing if no reference is provided
            }

            Log::info('=== HANDLE CASH TRANSACTION FLOW COMPLETED ===');
        } catch (\Exception $e) {
            Log::error('=== HANDLE CASH TRANSACTION FLOW ERROR ===', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Update invoice or payment order paid_amount when cash is credited
     */
    private function updateReferencePaidAmount(string $invoiceNumber, float $transactionAmount): void
    {
        // Determine if this is an invoice or payment order based on prefix
        if (str_starts_with($invoiceNumber, 'INV')) {
            // Handle Invoice
            $invoice = Invoice::where('invoice_number', $invoiceNumber)->first();
            
            if (!$invoice) {
                throw new \Exception("Invoice with number '{$invoiceNumber}' not found.");
            }

            // Validate invoice status - only allow payment for Pending or Partially Paid invoices
            $allowedStatuses = ['Pending', 'Partially Paid'];
            if (!in_array($invoice->status, $allowedStatuses)) {
                throw new \Exception("Invoice '{$invoiceNumber}' has status '{$invoice->status}'. Only invoices with status 'Pending' or 'Partially Paid' can receive payments.");
            }

            // Calculate new paid amount
            $currentPaidAmount = $invoice->paid_amount ?? 0;
            $newPaidAmount = $currentPaidAmount + $transactionAmount;
            $totalAmount = $invoice->total_amount ?? 0;

            // Validate that new paid amount doesn't exceed total amount
            if ($newPaidAmount > $totalAmount) {
                throw new \Exception("Payment amount ({$transactionAmount}) would exceed invoice total amount ({$totalAmount}). Current paid amount: {$currentPaidAmount}");
            }

            // Update the invoice status based on current status and payment amount
            $currentStatus = $invoice->status;
            $newStatus = $currentStatus;
            
            if ($newPaidAmount >= $totalAmount) {
                // Full payment - always set to Paid
                $newStatus = 'Paid';
            } else {
                // Partial payment
                if ($currentStatus === 'Pending') {
                    // If was Pending, change to Partially Paid
                    $newStatus = 'Partially Paid';
                }
                // If was already Partially Paid, keep it as Partially Paid
            }
            
            Log::info('=== UPDATING INVOICE STATUS ===', [
                'invoice_number' => $invoiceNumber,
                'current_status' => $currentStatus,
                'new_status' => $newStatus,
                'new_paid_amount' => $newPaidAmount,
                'total_amount' => $totalAmount
            ]);
            
            // Use the model update method with explicit status value
            $invoice->paid_amount = $newPaidAmount;
            $invoice->status = $newStatus;
            $invoice->updated_by = auth()->id();
            $invoice->save();

            Log::info('Invoice paid amount updated', [
                'invoice_number' => $invoiceNumber,
                'previous_paid_amount' => $currentPaidAmount,
                'transaction_amount' => $transactionAmount,
                'new_paid_amount' => $newPaidAmount,
                'total_amount' => $totalAmount,
                'new_status' => $newStatus
            ]);

        } elseif (str_starts_with($invoiceNumber, 'PMT')) {
            // Handle Payment Order
            $paymentOrder = \App\Models\PaymentOrder::where('payment_order_number', $invoiceNumber)->first();
            
            if (!$paymentOrder) {
                throw new \Exception("Payment order with number '{$invoiceNumber}' not found.");
            }

            // Validate payment order status - only allow payment for Pending or Partially Paid payment orders
            $allowedStatuses = ['Pending', 'Partially Paid'];
            if (!in_array($paymentOrder->status, $allowedStatuses)) {
                throw new \Exception("Payment order '{$invoiceNumber}' has status '{$paymentOrder->status}'. Only payment orders with status 'Pending' or 'Partially Paid' can receive payments.");
            }

            // Calculate new paid amount
            $currentPaidAmount = $paymentOrder->paid_amount ?? 0;
            $newPaidAmount = $currentPaidAmount + $transactionAmount;
            $totalAmount = $paymentOrder->total_amount ?? 0;

            // Validate that new paid amount doesn't exceed total amount
            if ($newPaidAmount > $totalAmount) {
                throw new \Exception("Payment amount ({$transactionAmount}) would exceed payment order total amount ({$totalAmount}). Current paid amount: {$currentPaidAmount}");
            }

            // Update the payment order status based on current status and payment amount
            $currentStatus = $paymentOrder->status;
            $newStatus = $currentStatus;
            
            if ($newPaidAmount >= $totalAmount) {
                // Full payment - always set to Paid
                $newStatus = 'Paid';
            } else {
                // Partial payment
                if ($currentStatus === 'Pending') {
                    // If was Pending, change to Partially Paid
                    $newStatus = 'Partially Paid';
                }
                // If was already Partially Paid, keep it as Partially Paid
            }
            
            Log::info('=== UPDATING PAYMENT ORDER STATUS ===', [
                'payment_order_number' => $invoiceNumber,
                'current_status' => $currentStatus,
                'new_status' => $newStatus,
                'new_paid_amount' => $newPaidAmount,
                'total_amount' => $totalAmount
            ]);
            
            // Use the model update method with explicit status value
            $paymentOrder->paid_amount = $newPaidAmount;
            $paymentOrder->status = $newStatus;
            $paymentOrder->save();

            Log::info('Payment order paid amount updated', [
                'payment_order_number' => $invoiceNumber,
                'previous_paid_amount' => $currentPaidAmount,
                'transaction_amount' => $transactionAmount,
                'new_paid_amount' => $newPaidAmount,
                'total_amount' => $totalAmount,
                'new_status' => $newStatus
            ]);

        } else {
            throw new \Exception("Invalid reference number format. Must start with 'INV' (for invoices) or 'PMT' (for payment orders).");
        }
    }

    /**
     * Update related account balances when cash is credited
     */
    private function updateRelatedAccountBalances(float $transactionAmount, string $referenceNumber): void
    {
        // DEPRECATED: This method is no longer used. All VAT/base allocation is handled by TransactionFlowService.
        \Log::warning('updateRelatedAccountBalances is deprecated. Use TransactionFlowService for all VAT/base allocation.');
        return;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Account $account): JsonResponse
    {
        try {
            // Prevent deletion of critical accounts
            if ($account->id === 2) {
                return response()->json([
                    'message' => 'Cannot delete Liabilities account (ID 2). This is a critical system account.',
                    'error' => 'Critical account deletion not allowed'
                ], Response::HTTP_FORBIDDEN);
            }

            DB::beginTransaction();

            $account->delete();

            DB::commit();

            return response()->json([
                'message' => 'Account deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted ledger.
     */
    public function restore(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ledger = Account::withTrashed()->findOrFail($id);
            $ledger->restore();

            DB::commit();

            return response()->json([
                'message' => 'Account restored successfully',
                'data' => new AccountResource($ledger)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
