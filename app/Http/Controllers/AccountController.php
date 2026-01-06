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
    private function isSpecialAccountId($id) {
        return in_array((int)$id, [1, 3, 6, 7, 10], true);
    }

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
        // Store original values for comparison
        $originalCreditAmount = floatval($account->credit_amount ?? 0);
        $originalDebitAmount = floatval($account->debit_amount ?? 0);

        // Get validated data early to check for Account 8
        $data = $request->validated();

        // Check if this is Account 8 (VAT Paid) BEFORE starting transaction
        // Account 8 has its own transaction handling
        if ($account->id == 8 && $account->name === 'VAT Paid (on purchases)') {
            \Log::info('=== ACCOUNT 8 DETECTED IN NON-API CONTROLLER (EARLY CHECK) ===', [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'has_credit_amount' => $request->has('credit_amount'),
                'credit_amount' => $request->input('credit_amount'),
                'has_invoice_number' => $request->has('invoice_number'),
                'invoice_number' => $request->input('invoice_number'),
                'validated_data' => $data
            ]);
            
            if (isset($data['credit_amount']) && floatval($data['credit_amount']) > 0 &&
                isset($data['invoice_number']) && !empty(trim($data['invoice_number']))) {
                
                \Log::info('=== ACCOUNT 8 CONDITION MET - CALLING handleVatPaidAccountUpdate (NO PARENT TRANSACTION) ===');
                return $this->handleVatPaidAccountUpdate($request, $account, $originalCreditAmount);
            } else {
                \Log::warning('=== ACCOUNT 8 DETECTED BUT CONDITIONS NOT MET ===', [
                    'credit_amount' => $data['credit_amount'] ?? 'NOT SET',
                    'invoice_number' => $data['invoice_number'] ?? 'NOT SET'
                ]);
            }
        }

        try {
            DB::beginTransaction();

            // Special handling for Account ID 2 (Liabilities) - validate BEFORE updating
            if ($account->id == 2 && $account->name === 'Accounts Payable' && 
                $request->has('debit_amount') && 
                $request->debit_amount > 0) {
                $this->validateLiabilitiesAccountUpdate($request);
            }
            
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
            if ($this->isSpecialAccountId($account->id)) {
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
        // Validate payment order number exists in payment_orders table
        if (!isset($data['invoice_number']) || empty($data['invoice_number'])) {
            throw new \Exception('Payment order number is required for Liabilities account debit operations.');
        }
        // Check if payment order exists
        $paymentOrder = \App\Models\PaymentOrder::whereRaw('LOWER(TRIM(payment_order_number)) = ?', [strtolower(trim($data['invoice_number']))])->first();
        if (!$paymentOrder) {
            throw new \Exception('Payment order number not found in payment_orders table.');
        }
        $purchaseOrderId = (int) $paymentOrder->purchase_order_id;
        if (!$purchaseOrderId) {
            throw new \Exception('Payment order is not linked to any purchase order.');
        }
        // Check if external invoice exists for this purchase order
        $externalInvoice = \App\Models\ExternalInvoice::where('purchase_order_id', $purchaseOrderId)
            ->whereNull('deleted_at')
            ->first();
        if (!$externalInvoice) {
            throw new \Exception('No external invoice found for this payment order.');
        }
        $debitAmount = $data['debit_amount'];
        $total = $externalInvoice->amount + $externalInvoice->vat_amount;
        $proportion = $debitAmount / $total;
        $basePaid = round($externalInvoice->amount * $proportion, 2);
        $vatPaid = round($externalInvoice->vat_amount * $proportion, 2);
        $totalDebitAmount = $basePaid + $vatPaid;
        // Validate that paid_amount + totalDebitAmount <= amount + vat_amount
        $invoiceTotal = $externalInvoice->amount + $externalInvoice->vat_amount;
        $newPaidAmount = $externalInvoice->paid_amount + $totalDebitAmount;
        if ($newPaidAmount > $invoiceTotal) {
            throw new \Exception('Amount exceeds invoice payable amount.');
        }
    }

    /**
     * Handle special update logic for Liabilities account (ID 2)
     */
    private function handleLiabilitiesAccountUpdate(Request $request, Account $account, float $originalCreditAmount): void
    {
        $data = $request->validated();
        $paymentOrderNumber = trim($data['invoice_number']);
        $paymentOrder = \App\Models\PaymentOrder::whereRaw('LOWER(TRIM(payment_order_number)) = ?', [strtolower($paymentOrderNumber)])->first();
        if (!$paymentOrder) {
            throw new \Exception('Payment order number not found in payment_orders table.');
        }
        $purchaseOrderId = (int) $paymentOrder->purchase_order_id;
        if (!$purchaseOrderId) {
            throw new \Exception('Payment order is not linked to any purchase order.');
        }
        $externalInvoice = \App\Models\ExternalInvoice::where('purchase_order_id', $purchaseOrderId)
            ->whereNull('deleted_at')
            ->first();
        if (!$externalInvoice) {
            throw new \Exception('No external invoice found for this payment order.');
        }
        $debitAmount = $data['debit_amount'];
        $total = $externalInvoice->amount + $externalInvoice->vat_amount;
        $proportion = $debitAmount / $total;
        $basePaid = round($externalInvoice->amount * $proportion, 2);
        $vatPaid = round($externalInvoice->vat_amount * $proportion, 2);
        $totalDebitAmount = $basePaid + $vatPaid;
        // Update paid_amount and status
        $externalInvoice->paid_amount = $externalInvoice->paid_amount + $totalDebitAmount;
        $invoiceTotal = $externalInvoice->amount + $externalInvoice->vat_amount;
        if ($externalInvoice->paid_amount < $invoiceTotal) {
            $externalInvoice->status = 'Partially Paid';
        } else {
            $externalInvoice->status = 'Paid';
        }
        $externalInvoice->save();
        // Optionally, update payment order status as well
        if ($paymentOrder->paid_amount + $debitAmount < $paymentOrder->total_amount + $paymentOrder->vat_amount) {
            $paymentOrder->status = 'Partially Paid';
        } else {
            $paymentOrder->status = 'Paid';
        }
        $paymentOrder->paid_amount += $debitAmount;
        $paymentOrder->save();

        // Update budget consumption based on payment amount
        \Log::info('=== CALLING UPDATE BUDGET CONSUMPTION ===', [
            'payment_order_id' => $paymentOrder->id,
            'debit_amount' => $debitAmount,
            'payment_order_number' => $paymentOrder->payment_order_number
        ]);
        $this->updateBudgetConsumption($paymentOrder, $debitAmount);

        // Record transaction flow for Liabilities (id 2)
        \App\Services\TransactionFlowService::recordTransactionFlow(
            2, // account_id
            'debit',
            $debitAmount,
            'liabilities_payment',
            $externalInvoice->id,
            [],
            "Liabilities payment for payment order {$paymentOrderNumber} (Amount: {$basePaid}, Tax: {$vatPaid})",
            $paymentOrderNumber,
            now()->toDateString(),
            $data['attachment'] ?? null,
            $data['original_name'] ?? null
        );

        // Credit Cost of Purchases (Account 5) with base amount - reduces expense when payment is made
        if ($basePaid > 0) {
            DB::table('accounts')
                ->where('id', 5)
                ->increment('credit_amount', $basePaid);
                
            \App\Services\TransactionFlowService::recordTransactionFlow(
                5, // account_id
                'credit',
                $basePaid,
                'liabilities_payment',
                $externalInvoice->id,
                [],
                "Cost of Purchases credited for payment order {$paymentOrderNumber} (base amount: {$basePaid})",
                $paymentOrderNumber,
                now()->toDateString(),
                $data['attachment'] ?? null,
                $data['original_name'] ?? null
            );
        }

        // Debit VAT Paid (id 8) with VAT amount - VAT expense increases when payment is made
        if ($vatPaid > 0) {
            \App\Services\TransactionFlowService::recordTransactionFlow(
                8, // VAT Paid (on purchases)
                'debit',
                $vatPaid,
                'vat_paid',
                $externalInvoice->id,
                [],
                "VAT paid for payment order {$paymentOrderNumber} (Tax: {$vatPaid})",
                $paymentOrderNumber,
                now()->toDateString(),
                $data['attachment'] ?? null,
                $data['original_name'] ?? null
            );
            // Update VAT Paid account's debit_amount
            $vatAccount = \App\Models\Account::find(8);
            if ($vatAccount) {
                $vatAccount->debit_amount = ($vatAccount->debit_amount ?? 0) + $vatPaid;
                $vatAccount->save();
            }
        }

        // Update total debit for Liabilities account (id 2)
        $liabilitiesAccount = \App\Models\Account::find(2);
        if ($liabilitiesAccount) {
            $totalDebits = \App\Services\TransactionFlowService::sumDebitsForAccount(2);
            $liabilitiesAccount->debit_amount = $totalDebits;
            $liabilitiesAccount->save();
        }
    }

    /**
     * Handle Account 8 (VAT Paid) credit updates for VAT refunds from government
     */
    private function handleVatPaidAccountUpdate(Request $request, Account $account, float $originalCreditAmount): JsonResponse
    {
        DB::beginTransaction();
        
        \Log::info('=== ENTERED handleVatPaidAccountUpdate (NON-API) ===', [
            'account_id' => $account->id,
            'account_name' => $account->name
        ]);

        $data = $request->validated();
        $creditAmount = floatval($data['credit_amount']);
        $paymentOrderNumber = trim($data['invoice_number'] ?? '');

        if (!$paymentOrderNumber) {
            DB::rollBack();
            return response()->json([
                'message' => 'Payment order number is required for Account 8 credit operations.',
                'error' => 'Missing payment order number'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        \Log::info('Looking up payment order for Account 8', [
            'payment_order_number' => $paymentOrderNumber
        ]);

        // Find payment order
        $paymentOrder = \App\Models\PaymentOrder::whereRaw('LOWER(TRIM(payment_order_number)) = ?', [strtolower($paymentOrderNumber)])->first();

        if (!$paymentOrder) {
            DB::rollBack();
            \Log::error('Payment order not found for Account 8', [
                'payment_order_number' => $paymentOrderNumber
            ]);
            return response()->json([
                'message' => 'Payment order not found.',
                'error' => 'Invalid payment order number'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Calculate actual VAT paid for this payment order
        $vatPaidController = new \App\Http\Controllers\Api\V1\VatPaidController();
        $reflection = new \ReflectionClass($vatPaidController);
        
        // Get calculateActualVatPaid method
        $calculateVatPaidMethod = $reflection->getMethod('calculateActualVatPaid');
        $calculateVatPaidMethod->setAccessible(true);
        $vatPaid = $calculateVatPaidMethod->invoke($vatPaidController, $paymentOrder);
        
        // Get calculateAccount8DebitsForPaymentOrder method
        $calculateDebitsMethod = $reflection->getMethod('calculateAccount8DebitsForPaymentOrder');
        $calculateDebitsMethod->setAccessible(true);
        $account8Debits = $calculateDebitsMethod->invoke($vatPaidController, $paymentOrder->payment_order_number);
        
        // Get calculateAccount8CreditsForPaymentOrder method
        $calculateCreditsMethod = $reflection->getMethod('calculateAccount8CreditsForPaymentOrder');
        $calculateCreditsMethod->setAccessible(true);
        $account8Credits = $calculateCreditsMethod->invoke($vatPaidController, $paymentOrder->payment_order_number);
        
        // Calculate VAT available for credit = VAT debited (paid) - VAT credited (refunded)
        $vatAvailableForCredit = $account8Debits - $account8Credits;

        \Log::info('Account 8 VAT calculation', [
            'payment_order_number' => $paymentOrderNumber,
            'vat_paid' => $vatPaid,
            'account8_debits' => $account8Debits,
            'account8_credits' => $account8Credits,
            'vat_available_for_credit' => $vatAvailableForCredit,
            'credit_amount_requested' => $creditAmount,
            'credit_amount_type' => gettype($creditAmount),
            'request_data' => $data
        ]);
        
        // Validate that credit amount doesn't exceed available VAT for credit
        // Use a small tolerance for floating point comparison
        if ($creditAmount > ($vatAvailableForCredit + 0.01)) {
            DB::rollBack();
            \Log::warning('Account 8 credit validation failed', [
                'credit_amount' => $creditAmount,
                'vat_available_for_credit' => $vatAvailableForCredit,
                'difference' => $creditAmount - $vatAvailableForCredit
            ]);
            return response()->json([
                'message' => "Credit amount ({$creditAmount}) cannot exceed available VAT for credit ({$vatAvailableForCredit}). VAT debited: {$account8Debits}, VAT credited: {$account8Credits}",
                'error' => 'Credit exceeds available VAT',
                'vat_debited' => $account8Debits,
                'vat_credited' => $account8Credits,
                'vat_available_for_credit' => $vatAvailableForCredit,
                'credit_amount_requested' => $creditAmount
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Update Account 8 with credit amount (increment credit, reduces VAT expense)
        // IMPORTANT: Don't touch debit_amount - it should remain unchanged
        // Note: invoice_number is stored in transaction flow, not in accounts table
        $account->credit_amount = ($account->credit_amount ?? 0) + $creditAmount;
        // Don't set invoice_number on account - it's not a column in accounts table
        // The invoice_number will be stored in the transaction flow record
        // Explicitly preserve debit_amount - don't update it
        $account->save();

        \Log::info('Account 8 updated', [
            'new_credit_amount' => $account->credit_amount,
            'credit_increment' => $creditAmount
        ]);
        
        // Record transaction flow for Account 8 (VAT Paid) - credit reduces the expense
        // IMPORTANT: This must be done BEFORE committing the transaction
        $transactionFlow = null;
        try {
            // Reload account to get updated credit_amount for balance calculation
            $account->refresh();
            $account->load('accountCode'); // Ensure accountCode relationship is loaded
            
            \Log::info('About to record transaction flow for Account 8', [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'account_code_id' => $account->account_code_id,
                'account_code_type' => $account->accountCode ? $account->accountCode->account_type : 'NULL',
                'debit_amount' => $account->debit_amount,
                'credit_amount' => $account->credit_amount,
                'transaction_credit_amount' => $creditAmount,
                'payment_order_number' => $paymentOrderNumber,
                'payment_order_id' => $paymentOrder->id
            ]);
            
            // Record the transaction flow - this creates a new record in the transactions_flow table
            // IMPORTANT: This must happen within the DB transaction so it gets committed together
            try {
                $transactionFlow = TransactionFlowService::recordTransactionFlow(
                    8, // account_id
                    'credit',
                    $creditAmount,
                    'vat_paid_refund',
                    $paymentOrder->id,
                    [],
                    "VAT Paid credited - VAT refunded from government (Payment Order: {$paymentOrderNumber})",
                    $paymentOrderNumber,
                    now()->toDateString(),
                    $data['attachment'] ?? null,
                    $data['original_name'] ?? null
                );

                // Verify the transaction flow was created
                if (!$transactionFlow) {
                    throw new \Exception('Transaction flow was not created - null returned from recordTransactionFlow');
                }
                
                if (!$transactionFlow->id) {
                    throw new \Exception('Transaction flow was not created - no ID returned');
                }
                
                // Force save to ensure it's persisted (even though create() should do this)
                $transactionFlow->save();
                
                \Log::info('Transaction flow created and saved', [
                    'transaction_flow_id' => $transactionFlow->id,
                    'account_id' => 8,
                    'amount' => $creditAmount,
                    'reference_number' => $paymentOrderNumber
                ]);
            } catch (\Exception $createException) {
                \Log::error('Exception while creating transaction flow', [
                    'error' => $createException->getMessage(),
                    'trace' => $createException->getTraceAsString()
                ]);
                throw $createException; // Re-throw to be caught by outer catch
            }

            \Log::info('Transaction flow recorded successfully for Account 8', [
                'transaction_flow_id' => $transactionFlow->id,
                'account_id' => 8,
                'transaction_type' => 'credit',
                'amount' => $creditAmount,
                'reference_number' => $paymentOrderNumber,
                'account_debit_amount' => $account->debit_amount,
                'account_credit_amount' => $account->credit_amount,
                'balance_after' => $transactionFlow->balance_after ?? 'NOT SET',
                'transaction_date' => $transactionFlow->transaction_date ?? 'NOT SET',
                'description' => $transactionFlow->description ?? 'NOT SET'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to record transaction flow for Account 8', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'account_id' => $account->id,
                'account_name' => $account->name,
                'account_code_id' => $account->account_code_id,
                'account_code' => $account->accountCode ? $account->accountCode->toArray() : 'NULL',
                'credit_amount' => $creditAmount,
                'payment_order_number' => $paymentOrderNumber
            ]);
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record transaction flow: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        
        DB::commit();

        // Verify transaction flow was actually saved to database
        // Use case-insensitive and trimmed comparison like in the calculation
        $paymentOrderNumberTrimmed = trim($paymentOrderNumber);
        
        // Wait a moment for the database to be updated (sometimes needed for replication)
        usleep(100000); // 100ms delay
        
        // First, check if the transaction flow we just created exists
        $savedTransactionFlow = null;
        if ($transactionFlow && $transactionFlow->id) {
            $savedTransactionFlow = \App\Models\TransactionFlow::find($transactionFlow->id);
        }
        
        // If not found by ID, try searching by criteria
        if (!$savedTransactionFlow) {
            $savedTransactionFlow = \App\Models\TransactionFlow::where('account_id', 8)
                ->whereRaw('LOWER(TRIM(reference_number)) = ?', [strtolower($paymentOrderNumberTrimmed)])
                ->where('transaction_type', 'credit')
                ->where('amount', $creditAmount)
                ->orderBy('id', 'desc')
                ->first();
        }
        
        // Also check all credit transactions for this payment order to see what's in the database
        $allCreditsForPO = \App\Models\TransactionFlow::where('account_id', 8)
            ->whereRaw('LOWER(TRIM(reference_number)) = ?', [strtolower($paymentOrderNumberTrimmed)])
            ->where('transaction_type', 'credit')
            ->select('id', 'reference_number', 'amount', 'transaction_date', 'description', 'created_at')
            ->orderBy('id', 'desc')
            ->get();
        
        \Log::info('=== ACCOUNT 8 CREDIT COMPLETED (NON-API) ===', [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'credit_amount' => $creditAmount,
            'payment_order_number' => $paymentOrderNumber,
            'payment_order_number_trimmed' => $paymentOrderNumberTrimmed,
            'vat_debited' => $account8Debits,
            'vat_credited' => $account8Credits + $creditAmount,
            'vat_available_for_credit_remaining' => $vatAvailableForCredit - $creditAmount,
            'transaction_flow_created_id' => $transactionFlow->id ?? 'NOT SET',
            'transaction_flow_verified_in_db' => $savedTransactionFlow ? 'YES (ID: ' . $savedTransactionFlow->id . ')' : 'NO - NOT FOUND IN DATABASE',
            'all_credits_for_po_count' => $allCreditsForPO->count(),
            'all_credits_for_po' => $allCreditsForPO->map(function($t) {
                return [
                    'id' => $t->id,
                    'reference_number' => $t->reference_number,
                    'amount' => $t->amount,
                    'transaction_date' => $t->transaction_date,
                    'description' => $t->description,
                    'created_at' => $t->created_at
                ];
            })->toArray()
        ]);

        if (!$savedTransactionFlow) {
            \Log::error('CRITICAL: Transaction flow was not saved to database after commit!', [
                'account_id' => 8,
                'payment_order_number' => $paymentOrderNumber,
                'credit_amount' => $creditAmount,
                'expected_transaction_flow_id' => $transactionFlow->id ?? 'NOT SET'
            ]);
        }

        return response()->json([
            'message' => 'Account 8 updated successfully. Credit amount: ' . $creditAmount . ' SAR. VAT available for credit remaining: ' . ($vatAvailableForCredit - $creditAmount) . ' SAR',
            'data' => new AccountResource($account->load(['costCenter', 'creator', 'updater'])),
            'transaction_flow_id' => $transactionFlow->id ?? null
        ], Response::HTTP_OK);
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

            // Validate invoice status - only allow payment for Approved, Partially Paid, or Overdue invoices
            $allowedStatuses = ['Approved', 'Partially Paid', 'Overdue'];
            if (!in_array($invoice->status, $allowedStatuses)) {
                throw new \Exception("Invoice '{$invoiceNumber}' has status '{$invoice->status}'. Only invoices with status 'Approved', 'Partially Paid', or 'Overdue' can receive payments.");
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

            // If invoice is fully paid, update related material requests to "Pending" status
            if ($newStatus === 'Paid') {
                $this->updateMaterialRequestsForPaidInvoice($invoice);
            }

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

    /**
     * Update material requests to "Approved" status when an external invoice is fully paid
     */
    private function updateMaterialRequestsForPaidInvoice($invoice)
    {
        try {
            // Find material requests that are in "Referred" status and related to this invoice
            // This assumes there's a relationship between invoices and material requests through RFQ
            $materialRequests = \App\Models\MaterialRequest::where('status_id', 2) // Referred status
                ->get();

            foreach ($materialRequests as $materialRequest) {
                // Update to "Approved" status (status_id = 4) - shows as "Pending" in frontend
                $materialRequest->update([
                    'status_id' => 4, // Approved status (shows as Pending in frontend)
                    'updated_at' => now()
                ]);

                \Log::info('Material request status updated to Approved after invoice payment', [
                    'material_request_id' => $materialRequest->id,
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Error updating material requests for paid invoice', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Update budget consumption based on payment amount
     * Payment Order → Purchase Order → Request Budget
     */
    private function updateBudgetConsumption($paymentOrder, $paymentAmount)
    {
        \Log::info('=== UPDATE BUDGET CONSUMPTION METHOD CALLED ===', [
            'payment_order_id' => $paymentOrder->id,
            'payment_amount' => $paymentAmount,
            'method_started_at' => now()
        ]);
        
        try {
            // Step 1: Payment Order → Purchase Order
            $purchaseOrder = \App\Models\PurchaseOrder::find($paymentOrder->purchase_order_id);
            
            if (!$purchaseOrder) {
                \Log::error('=== PURCHASE ORDER NOT FOUND ===', [
                    'payment_order_id' => $paymentOrder->id,
                    'purchase_order_id' => $paymentOrder->purchase_order_id
                ]);
                return;
            }

            // Step 2: Purchase Order → Request Budget ID
            $requestBudgetId = $purchaseOrder->request_budget_id;

            // If no direct budget link, try to find the appropriate budget
            if (!$requestBudgetId) {
                \Log::info('=== NO DIRECT BUDGET LINK, ATTEMPTING TO FIND BUDGET ===', [
                    'payment_order_id' => $paymentOrder->id,
                    'purchase_order_id' => $purchaseOrder->id,
                    'department_id' => $purchaseOrder->department_id,
                    'cost_center_id' => $purchaseOrder->cost_center_id,
                    'sub_cost_center_id' => $purchaseOrder->sub_cost_center_id,
                    'fiscal_period_id' => $purchaseOrder->fiscal_period_id
                ]);

                // Try to find a budget based on Purchase Order details
                $budgetQuery = \App\Models\RequestBudget::where('status', 'Approved');
                
                if ($purchaseOrder->department_id) {
                    $budgetQuery->where('department_id', $purchaseOrder->department_id);
                }
                
                if ($purchaseOrder->cost_center_id) {
                    $budgetQuery->where('cost_center_id', $purchaseOrder->cost_center_id);
                }
                
                if ($purchaseOrder->sub_cost_center_id) {
                    $budgetQuery->where('sub_cost_center', $purchaseOrder->sub_cost_center_id);
                } else {
                    $budgetQuery->whereNull('sub_cost_center');
                }
                
                if ($purchaseOrder->fiscal_period_id) {
                    $budgetQuery->where('fiscal_period_id', $purchaseOrder->fiscal_period_id);
                }

                $foundBudget = $budgetQuery->first();
                
                if ($foundBudget) {
                    $requestBudgetId = $foundBudget->id;
                    \Log::info('=== FOUND MATCHING BUDGET ===', [
                        'payment_order_id' => $paymentOrder->id,
                        'purchase_order_id' => $purchaseOrder->id,
                        'found_budget_id' => $requestBudgetId,
                        'budget_consumed_amount' => $foundBudget->consumed_amount,
                        'budget_reserved_amount' => $foundBudget->reserved_amount,
                        'budget_balance_amount' => $foundBudget->balance_amount
                    ]);
                } else {
                    \Log::warning('=== NO MATCHING BUDGET FOUND ===', [
                        'payment_order_id' => $paymentOrder->id,
                        'purchase_order_id' => $purchaseOrder->id,
                        'department_id' => $purchaseOrder->department_id,
                        'cost_center_id' => $purchaseOrder->cost_center_id,
                        'sub_cost_center_id' => $purchaseOrder->sub_cost_center_id,
                        'fiscal_period_id' => $purchaseOrder->fiscal_period_id
                    ]);
                    return;
                }
            }

            // Get external invoice to calculate base amount (VAT excluded from budget)
            $externalInvoice = \App\Models\ExternalInvoice::where('purchase_order_id', $purchaseOrder->id)
                ->whereNull('deleted_at')
                ->first();
            
            if (!$externalInvoice) {
                \Log::warning('=== EXTERNAL INVOICE NOT FOUND FOR BUDGET CONSUMPTION ===', [
                    'payment_order_id' => $paymentOrder->id,
                    'purchase_order_id' => $purchaseOrder->id
                ]);
                return;
            }
            
            // Calculate base amount portion of payment (VAT excluded from budget consumption)
            $invoiceBase = floatval($externalInvoice->amount);
            $invoiceVat = floatval($externalInvoice->vat_amount);
            $invoiceTotal = $invoiceBase + $invoiceVat;
            
            // Calculate proportion of payment that goes to base amount
            $basePaymentAmount = 0;
            if ($invoiceTotal > 0) {
                $proportion = $paymentAmount / $invoiceTotal;
                $basePaymentAmount = round($invoiceBase * $proportion, 2);
            } else {
                $basePaymentAmount = $paymentAmount; // Fallback if no invoice data
            }
            
            // Normal scenario: Single budget update (split budget transfer happens on PO approval, not payment)
            \Log::info('=== UPDATING BUDGET CONSUMPTION FOR PAYMENT ===', [
                'payment_order_id' => $paymentOrder->id,
                'purchase_order_id' => $purchaseOrder->id,
                'request_budget_id' => $requestBudgetId,
                'payment_amount' => $paymentAmount,
                'base_payment_amount' => $basePaymentAmount,
                'vat_excluded' => $paymentAmount - $basePaymentAmount,
                'po_base_amount' => $purchaseOrder->amount,
                'po_vat_amount' => $purchaseOrder->vat_amount,
                'note' => 'Only base amount consumed from budget (VAT excluded)'
            ]);

            // Step 3: Update Request Budget amounts
            // First, let's get the current budget values
            $currentBudget = \Illuminate\Support\Facades\DB::table('request_budgets')->where('id', $requestBudgetId)->first();
            if ($currentBudget) {
                \Log::info('=== CURRENT BUDGET VALUES ===', [
                    'request_budget_id' => $requestBudgetId,
                    'current_consumed_amount' => $currentBudget->consumed_amount,
                    'current_reserved_amount' => $currentBudget->reserved_amount,
                    'current_balance_amount' => $currentBudget->balance_amount
                ]);
            }

            // Calculate new values - only base amount consumed (VAT excluded)
            $newConsumedAmount = $currentBudget->consumed_amount + $basePaymentAmount;
            $newReservedAmount = $currentBudget->reserved_amount - $basePaymentAmount;

            \Log::info('=== CALCULATED NEW VALUES ===', [
                'new_consumed_amount' => $newConsumedAmount,
                'new_reserved_amount' => $newReservedAmount
            ]);

            // Update budget: increase consumed_amount and decrease reserved_amount
            $budgetUpdated = \Illuminate\Support\Facades\DB::table('request_budgets')
                ->where('id', $requestBudgetId)
                ->update([
                    'consumed_amount' => $newConsumedAmount,
                    'reserved_amount' => $newReservedAmount,
                    'updated_at' => now()
                ]);

            // Create audit log for budget consumption
            if ($budgetUpdated) {
                \Illuminate\Support\Facades\DB::table('budget_audit_logs')->insert([
                    'request_budget_id' => $requestBudgetId,
                    'purchase_order_id' => $purchaseOrder->id,
                    'action' => 'consume',
                    'amount' => $basePaymentAmount,
                    'reserved_amount_before' => $currentBudget->reserved_amount,
                    'reserved_amount_after' => $newReservedAmount,
                    'balance_amount_before' => $currentBudget->balance_amount,
                    'balance_amount_after' => $currentBudget->balance_amount, // Balance doesn't change on consumption
                    'notes' => "Payment made for PO {$purchaseOrder->purchase_order_no} via Payment Order {$paymentOrder->payment_order_number}. Base amount: {$basePaymentAmount} SAR (VAT excluded from budget).",
                    'created_by' => auth()->id(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            \Log::info('=== BUDGET CONSUMPTION UPDATE RESULT ===', [
                'payment_order_id' => $paymentOrder->id,
                'purchase_order_id' => $purchaseOrder->id,
                'request_budget_id' => $requestBudgetId,
                'budget_update_success' => $budgetUpdated,
                'base_amount_added_to_consumed' => $basePaymentAmount,
                'base_amount_reduced_from_reserved' => $basePaymentAmount,
                'total_payment_amount' => $paymentAmount,
                'vat_excluded_from_budget' => $paymentAmount - $basePaymentAmount,
                'note' => 'Only base amount affects budget (VAT is receivable asset, not budget expense)'
            ]);

            // Verify the update worked
            $updatedBudget = \Illuminate\Support\Facades\DB::table('request_budgets')->where('id', $requestBudgetId)->first();
            if ($updatedBudget) {
                \Log::info('=== CURRENT BUDGET STATUS AFTER PAYMENT ===', [
                    'request_budget_id' => $requestBudgetId,
                    'consumed_amount' => $updatedBudget->consumed_amount,
                    'reserved_amount' => $updatedBudget->reserved_amount,
                    'balance_amount' => $updatedBudget->balance_amount,
                    'update_was_successful' => ($updatedBudget->consumed_amount == $newConsumedAmount && $updatedBudget->reserved_amount == $newReservedAmount)
                ]);
            } else {
                \Log::error('=== BUDGET NOT FOUND AFTER UPDATE ===', [
                    'request_budget_id' => $requestBudgetId
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('=== ERROR UPDATING BUDGET CONSUMPTION ===', [
                'payment_order_id' => $paymentOrder->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
