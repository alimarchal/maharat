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

            // Update the account
            $account->update($request->validated());

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

                // Record transaction flow (without updating account balances since they're already updated)
                Log::info('=== CALLING TRANSACTION FLOW SERVICE ===', [
                    'method' => 'recordCashTransactionFlowsWithoutBalanceUpdate'
                ]);

                TransactionFlowService::recordCashTransactionFlowsWithoutBalanceUpdate(
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

            // Update related account balances for cash credit
            $this->updateRelatedAccountBalances($transactionAmount, $invoiceNumber);

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

            // Update related account balances for cash credit
            $this->updateRelatedAccountBalances($transactionAmount, $invoiceNumber);

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
        $vatAmount = $transactionAmount * 0.15; // 15% VAT

        try {
            // Get attachment and original_name from the request
            $attachment = request()->input('attachment');
            $originalName = request()->input('original_name');

            // 1. Update Account Receivable (ID 11) - Debit (decrease)
            $accountReceivable = Account::find(11);
            if ($accountReceivable) {
                $accountReceivable->debit_amount += $transactionAmount;
                $accountReceivable->save();
                
                // Create transaction flow for Account Receivable
                \App\Services\TransactionFlowService::recordTransactionFlow(
                    $accountReceivable->id,
                    'debit',
                    $transactionAmount,
                    'cash_transaction',
                    null,
                    ['cash' => 12],
                    'Account receivable debit for cash payment',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                
                Log::info('Account Receivable updated', [
                    'account_id' => 11,
                    'debit_amount_increase' => $transactionAmount,
                    'new_debit_amount' => $accountReceivable->debit_amount
                ]);
            }

            // 2. Update VAT Collected (ID 9) - Credit (increase)
            $vatCollected = Account::find(9);
            if ($vatCollected) {
                $vatCollected->credit_amount += $vatAmount;
                $vatCollected->save();
                
                // Create transaction flow for VAT Collected
                \App\Services\TransactionFlowService::recordTransactionFlow(
                    $vatCollected->id,
                    'credit',
                    $vatAmount,
                    'cash_transaction',
                    null,
                    ['cash' => 12],
                    'VAT collected credit for cash payment',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                
                Log::info('VAT Collected updated', [
                    'account_id' => 9,
                    'credit_amount_increase' => $vatAmount,
                    'new_credit_amount' => $vatCollected->credit_amount
                ]);
            }

            // 3. Update VAT Receivables (ID 13) - Debit (decrease)
            $vatReceivables = Account::find(13);
            if ($vatReceivables) {
                $vatReceivables->debit_amount += $vatAmount;
                $vatReceivables->save();
                
                // Create transaction flow for VAT Receivables
                \App\Services\TransactionFlowService::recordTransactionFlow(
                    $vatReceivables->id,
                    'debit',
                    $vatAmount,
                    'cash_transaction',
                    null,
                    ['cash' => 12],
                    'VAT receivables debit for cash payment',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                
                Log::info('VAT Receivables updated', [
                    'account_id' => 13,
                    'debit_amount_increase' => $vatAmount,
                    'new_debit_amount' => $vatReceivables->debit_amount
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to update related account balances', [
                'error' => $e->getMessage(),
                'transaction_amount' => $transactionAmount
            ]);
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Account $account): JsonResponse
    {
        try {
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
