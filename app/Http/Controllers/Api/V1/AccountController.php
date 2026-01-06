<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAccountRequest;
use App\Http\Resources\AccountResource;
use App\Services\AccountBalancingService;
use App\Services\TransactionFlowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Response;

class AccountController extends Controller
{
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

            \Log::info('=== ACCOUNT UPDATE CALLED ===', [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'request_all' => $request->all(),
                'request_validated' => $request->validated(),
                'has_credit_amount' => $request->has('credit_amount'),
                'credit_amount_value' => $request->input('credit_amount'),
                'has_debit_amount' => $request->has('debit_amount'),
                'debit_amount_value' => $request->input('debit_amount'),
                'has_invoice_number' => $request->has('invoice_number'),
                'invoice_number_value' => $request->input('invoice_number')
            ]);

            // Special handling for Account ID 2 (Liabilities)
            if ($account->id == 2 && $account->name === 'Liabilities') {
                return $this->handleLiabilitiesAccountUpdate($request, $account, $originalCreditAmount);
            }

            // Special handling for Account ID 14 (VAT Receivable on Purchases) - handle debit_amount updates
            $data = $request->validated();
            
            \Log::info('=== CHECKING ACCOUNT 14 CONDITION ===', [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'is_account_14' => $account->id == 14,
                'validated_data' => $data,
                'has_debit_in_data' => isset($data['debit_amount']),
                'debit_amount' => $data['debit_amount'] ?? 'NOT SET',
                'debit_amount_float' => isset($data['debit_amount']) ? floatval($data['debit_amount']) : 0
            ]);
            
            // Check for Account 14 - no name check needed, just ID check
            if ($account->id == 14) {
                \Log::info('=== ACCOUNT 14 DETECTED ===', [
                    'has_debit_amount' => isset($data['debit_amount']),
                    'debit_amount_value' => $data['debit_amount'] ?? 'NOT SET',
                    'debit_amount_float' => isset($data['debit_amount']) ? floatval($data['debit_amount']) : 0
                ]);
                
                if (isset($data['debit_amount']) && floatval($data['debit_amount']) > 0) {
                    \Log::info('=== ACCOUNT 14 CONDITION MET - CALLING handleVatReceivableAccountUpdate ===');
                    return $this->handleVatReceivableAccountUpdate($request, $account);
                } else {
                    \Log::warning('=== ACCOUNT 14 DETECTED BUT DEBIT AMOUNT NOT VALID ===', [
                        'debit_amount' => $data['debit_amount'] ?? 'NOT SET'
                    ]);
                }
            }
            
            // Check for Account 8 (VAT Paid) - credit operations for VAT refunds
            if ($account->id == 8) {
                \Log::info('=== ACCOUNT 8 DETECTED ===', [
                    'has_credit_amount' => isset($data['credit_amount']),
                    'credit_amount_value' => $data['credit_amount'] ?? 'NOT SET',
                    'credit_amount_float' => isset($data['credit_amount']) ? floatval($data['credit_amount']) : 0
                ]);
                
                if (isset($data['credit_amount']) && floatval($data['credit_amount']) > 0) {
                    \Log::info('=== ACCOUNT 8 CONDITION MET - CALLING handleVatPaidAccountUpdate ===');
                    return $this->handleVatPaidAccountUpdate($request, $account);
                } else {
                    \Log::warning('=== ACCOUNT 8 DETECTED BUT CREDIT AMOUNT NOT VALID ===', [
                        'credit_amount' => $data['credit_amount'] ?? 'NOT SET'
                    ]);
                }
            }
            
            \Log::info('=== SPECIAL ACCOUNT CONDITIONS NOT MET - CONTINUING WITH NORMAL UPDATE ===');

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
     * Handle special update logic for Liabilities account (ID 2)
     */
    private function handleLiabilitiesAccountUpdate(Request $request, Account $account, float $originalCreditAmount): JsonResponse
    {
        \Log::info('Entered handleLiabilitiesAccountUpdate');
        $data = $request->validated();
        \Log::info('LiabilitiesAccountUpdate request data', $data);
        try {
            // Ensure invoice_number is trimmed and treat as payment_order_number
            $paymentOrderNumber = trim($data['invoice_number']);
            // Debug log: incoming payment_order_number and all payment_order_numbers
            \Log::info('Looking up payment order', [
                'incoming_payment_order_number' => $paymentOrderNumber,
                'all_payment_order_numbers' => \App\Models\PaymentOrder::pluck('payment_order_number','id')->toArray()
            ]);
            // Find payment order by payment_order_number (trimmed, case-insensitive)
            $paymentOrder = \App\Models\PaymentOrder::whereRaw('LOWER(TRIM(payment_order_number)) = ?', [strtolower($paymentOrderNumber)])->first();
            if (!$paymentOrder) {
                \Log::error('Payment order not found', ['payment_order_number' => $paymentOrderNumber]);
                \Log::info('Flushing logs after payment order not found error');
                return response()->json([
                    'message' => 'Payment order number not found.',
                    'error' => 'Invalid payment order number',
                    'searched_payment_order_number' => $paymentOrderNumber,
                    'all_payment_orders' => \App\Models\PaymentOrder::pluck('payment_order_number','id')
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $purchaseOrderId = (int) $paymentOrder->purchase_order_id;
            if (!$purchaseOrderId) {
                \Log::error('Payment order not linked to any purchase order', [
                    'payment_order_number' => $paymentOrderNumber,
                    'payment_order_id' => $paymentOrder->id
                ]);
                \Log::info('Flushing logs after purchase_order_id null error');
                return response()->json([
                    'message' => 'This payment order is not linked to any purchase order.',
                    'error' => 'purchase_order_id is NULL for payment order: ' . $paymentOrderNumber,
                    'payment_order_id' => $paymentOrder->id,
                    'payment_order_number' => $paymentOrderNumber
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            \Log::info('Selected payment order', [
                'payment_order_number' => $paymentOrderNumber,
                'purchase_order_id' => $purchaseOrderId,
                'payment_order_id' => $paymentOrder->id
            ]);
            // Find external invoice by purchase_order_id (only non-deleted, force int)
            $externalInvoice = \App\Models\ExternalInvoice::where('purchase_order_id', $purchaseOrderId)
                ->whereNull('deleted_at')
                ->first();
            \Log::info('External invoice lookup result', [
                'found' => $externalInvoice ? true : false,
                'purchase_order_id' => $purchaseOrderId,
                'all_external_invoices' => \App\Models\ExternalInvoice::pluck('purchase_order_id','id')
            ]);
            if (!$externalInvoice) {
                \Log::error('No external invoice found for payment order', [
                    'payment_order_number' => $paymentOrderNumber,
                    'purchase_order_id' => $purchaseOrderId
                ]);
                \Log::info('Flushing logs after no external invoice found error');
                return response()->json([
                    'message' => 'No external invoice found for this payment order.',
                    'error' => 'No external invoice found for purchase_order_id: ' . $purchaseOrderId,
                    'searched_purchase_order_id' => $purchaseOrderId,
                    'all_external_invoices' => \App\Models\ExternalInvoice::pluck('purchase_order_id','id')
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        } catch (\Throwable $e) {
            \Log::error('Exception in handleLiabilitiesAccountUpdate', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $data
            ]);
            \Log::info('Flushing logs after exception');
            return response()->json([
                'message' => 'Exception occurred in handleLiabilitiesAccountUpdate',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        $debitAmount = $data['debit_amount'];
        $amount = floatval($externalInvoice->amount);
        $vat = floatval($externalInvoice->vat_amount);
        $paid = floatval($externalInvoice->paid_amount);
        $unpaid = $amount + $vat - $paid;
        if ($debitAmount > $unpaid) {
            return response()->json([
                'message' => 'Debit amount cannot exceed unpaid amount for this invoice.',
                'error' => 'Debit exceeds unpaid amount'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        // Calculate proportional split for reference (VAT is already in Account 14 as receivable)
        $total = $amount + $vat;
        $proportion = $debitAmount / $total;
        $taxPaid = round($vat * $proportion, 2);
        $netPaid = round($debitAmount - $taxPaid, 2);
        
        // Update the account with the total debit amount
        $account->update([
            'debit_amount' => $account->debit_amount + $debitAmount,
            'invoice_number' => $data['invoice_number'],
            'attachment' => $data['attachment'] ?? null,
            'original_name' => $data['original_name'] ?? null,
        ]);
        
        // Record transaction flow for Liabilities (id 2) - payment reduces liability
        \App\Services\TransactionFlowService::recordTransactionFlow(
            2, // account_id
            'debit',
            $debitAmount,
            'liabilities_payment',
            $externalInvoice->id,
            [],
            "Liabilities payment for invoice {$externalInvoice->invoice_id} (Total: {$debitAmount}, Base: {$netPaid}, VAT: {$taxPaid})",
            $data['invoice_number'],
            now()->toDateString(),
            $data['attachment'] ?? null,
            $data['original_name'] ?? null
        );
        
        // Credit Cost of Purchases (Account 5) with base amount - reduces expense when payment is made
        if ($netPaid > 0) {
            DB::table('accounts')
                ->where('id', 5)
                ->increment('credit_amount', $netPaid);
                
            \App\Services\TransactionFlowService::recordTransactionFlow(
                5, // account_id
                'credit',
                $netPaid,
                'liabilities_payment',
                $externalInvoice->id,
                [],
                "Cost of Purchases credited for payment (base amount: {$netPaid})",
                $data['invoice_number'],
                now()->toDateString(),
                $data['attachment'] ?? null,
                $data['original_name'] ?? null
            );
        }
        
        // Note: VAT portion is already recorded in Account 14 (VAT Receivable on Purchases) 
        // when the external invoice was created. No need to credit Account 8 (VAT Paid) 
        // as VAT is treated as a receivable asset, not an expense.
        // Update paid_amount in payment_order and external_invoice
        $paymentOrder->paid_amount += $debitAmount;
        $paymentOrder->save();
        $externalInvoice->paid_amount += $debitAmount;
        $externalInvoice->save();
        // Update status in payment_order
        $newPaid = $paymentOrder->paid_amount;
        $totalDue = floatval($paymentOrder->total_amount) + floatval($paymentOrder->vat_amount);
        if ($newPaid >= $totalDue) {
            $paymentOrder->status = 'Paid';
        } else {
            $paymentOrder->status = 'Partially Paid';
        }
        $paymentOrder->save();

        // Update budget consumption based on payment amount
        \Log::info('=== CALLING UPDATE BUDGET CONSUMPTION ===', [
            'payment_order_id' => $paymentOrder->id,
            'debit_amount' => $debitAmount,
            'payment_order_number' => $paymentOrder->payment_order_number
        ]);
        $this->updateBudgetConsumption($paymentOrder, $debitAmount);
        \Log::info('=== LIABILITIES ACCOUNT DEBIT COMPLETED (ENHANCED) ===', [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'debit_amount' => $debitAmount,
            'tax_paid' => $taxPaid,
            'net_paid' => $netPaid,
            'invoice_number' => $data['invoice_number'],
            'external_invoice_id' => $externalInvoice->id,
            'payment_order_id' => $paymentOrder->id
        ]);
        DB::commit();
        return response()->json([
            'message' => 'Liabilities account updated successfully. Debit amount: ' . $debitAmount . ', Tax: ' . $taxPaid . ', Net: ' . $netPaid,
            'data' => new AccountResource($account->load(['costCenter', 'creator', 'updater']))
        ], Response::HTTP_OK);
    }

    /**
     * Handle Account 14 (VAT Receivable on Purchases) debit updates
     * Similar to Account 2, allows multiple partial debits to track VAT receivable
     */
    private function handleVatReceivableAccountUpdate(Request $request, Account $account): JsonResponse
    {
        \Log::info('=== ENTERED handleVatReceivableAccountUpdate ===', [
            'account_id' => $account->id,
            'account_name' => $account->name
        ]);

        $data = $request->validated();
        $debitAmount = floatval($data['debit_amount']);
        $paymentOrderNumber = trim($data['invoice_number'] ?? '');

        if (!$paymentOrderNumber) {
            return response()->json([
                'message' => 'Payment order number is required for Account 14 debit operations.',
                'error' => 'Missing payment order number'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        \Log::info('Looking up payment order for Account 14', [
            'payment_order_number' => $paymentOrderNumber
        ]);

        // Find payment order
        $paymentOrder = \App\Models\PaymentOrder::whereRaw('LOWER(TRIM(payment_order_number)) = ?', [strtolower($paymentOrderNumber)])->first();

        if (!$paymentOrder) {
            \Log::error('Payment order not found for Account 14', [
                'payment_order_number' => $paymentOrderNumber
            ]);
            return response()->json([
                'message' => 'Payment order not found.',
                'error' => 'Invalid payment order number'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Calculate actual VAT paid for this payment order
        $vatReceivableController = new \App\Http\Controllers\Api\V1\VatReceivableController();
        $reflection = new \ReflectionClass($vatReceivableController);
        
        // Get calculateActualVatPaid method
        $calculateVatPaidMethod = $reflection->getMethod('calculateActualVatPaid');
        $calculateVatPaidMethod->setAccessible(true);
        $vatPaid = $calculateVatPaidMethod->invoke($vatReceivableController, $paymentOrder);
        
        // Get calculateAccount14DebitsForPaymentOrder method
        $calculateDebitsMethod = $reflection->getMethod('calculateAccount14DebitsForPaymentOrder');
        $calculateDebitsMethod->setAccessible(true);
        $account14Debits = $calculateDebitsMethod->invoke($vatReceivableController, $paymentOrder->payment_order_number);
        
        // Get calculateAccount14CreditsForPaymentOrder method
        $calculateCreditsMethod = $reflection->getMethod('calculateAccount14CreditsForPaymentOrder');
        $calculateCreditsMethod->setAccessible(true);
        $account14Credits = $calculateCreditsMethod->invoke($vatReceivableController, $paymentOrder->payment_order_number);
        
        // Calculate unpaid VAT = VAT paid - (debits + credits to Account 14)
        $totalAccounted = $account14Debits + $account14Credits;
        $vatUnpaid = $vatPaid - $totalAccounted;

        \Log::info('Account 14 VAT calculation', [
            'vat_paid' => $vatPaid,
            'account14_debits' => $account14Debits,
            'account14_credits' => $account14Credits,
            'total_accounted' => $totalAccounted,
            'vat_unpaid' => $vatUnpaid,
            'debit_amount' => $debitAmount
        ]);
        
        // Validate that debit amount doesn't exceed unpaid VAT
        if ($debitAmount > $vatUnpaid) {
            return response()->json([
                'message' => "Debit amount ({$debitAmount}) cannot exceed unpaid VAT amount ({$vatUnpaid}). Actual VAT paid: {$vatPaid}, Account 14 debits: {$account14Debits}, Account 14 credits: {$account14Credits}",
                'error' => 'Debit exceeds unpaid VAT',
                'vat_paid' => $vatPaid,
                'account14_debits' => $account14Debits,
                'account14_credits' => $account14Credits,
                'vat_unpaid' => $vatUnpaid
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Update Account 14 with debit amount (increment like Account 2)
        $account->debit_amount = ($account->debit_amount ?? 0) + $debitAmount;
        $account->invoice_number = $paymentOrderNumber;
        $account->attachment = $data['attachment'] ?? null;
        $account->original_name = $data['original_name'] ?? null;
        $account->save();

        \Log::info('Account 14 updated', [
            'new_debit_amount' => $account->debit_amount,
            'debit_increment' => $debitAmount
        ]);
        
        // Record transaction flow for Account 14 (VAT Receivable) - debit increases the receivable
        // This MUST be recorded so it appears in transaction flow table
        // IMPORTANT: Record AFTER account is saved so balance calculation is correct
        try {
            // Reload account to get updated debit_amount for balance calculation
            $account->refresh();
            $account->load('accountCode'); // Ensure accountCode relationship is loaded
            
            \Log::info('About to record transaction flow for Account 14', [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'account_code_id' => $account->account_code_id,
                'account_code_type' => $account->accountCode ? $account->accountCode->account_type : 'NULL',
                'debit_amount' => $account->debit_amount,
                'credit_amount' => $account->credit_amount,
                'transaction_debit_amount' => $debitAmount
            ]);
            
            $transactionFlow = TransactionFlowService::recordTransactionFlow(
                14, // account_id
                'debit',
                $debitAmount,
                'vat_receivable_manual',
                $paymentOrder->id,
                [],
                "VAT Receivable on Purchases debited manually (Payment Order: {$paymentOrderNumber})",
                $paymentOrderNumber,
                now()->toDateString(),
                $data['attachment'] ?? null,
                $data['original_name'] ?? null
            );

            \Log::info('Transaction flow recorded successfully for Account 14', [
                'transaction_flow_id' => $transactionFlow->id,
                'account_id' => 14,
                'transaction_type' => 'debit',
                'amount' => $debitAmount,
                'reference_number' => $paymentOrderNumber,
                'account_debit_amount' => $account->debit_amount,
                'account_credit_amount' => $account->credit_amount,
                'balance_after' => $transactionFlow->balance_after ?? 'NOT SET'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to record transaction flow for Account 14', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'account_id' => $account->id,
                'account_name' => $account->name,
                'account_code_id' => $account->account_code_id,
                'account_code' => $account->accountCode ? $account->accountCode->toArray() : 'NULL'
            ]);
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record transaction flow: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
        
        DB::commit();

        \Log::info('=== ACCOUNT 14 DEBIT COMPLETED ===', [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'debit_amount' => $debitAmount,
            'payment_order_number' => $paymentOrderNumber,
            'vat_paid' => $vatPaid,
            'vat_unpaid_remaining' => $vatUnpaid - $debitAmount
        ]);

        return response()->json([
            'message' => 'Account 14 updated successfully. Debit amount: ' . $debitAmount . ' SAR. VAT unpaid remaining: ' . ($vatUnpaid - $debitAmount) . ' SAR',
            'data' => new AccountResource($account->load(['costCenter', 'creator', 'updater']))
        ], Response::HTTP_OK);
    }

    /**
     * Handle Account 8 (VAT Paid) credit updates
     * Credits represent VAT refunds from government (reduces VAT expense)
     */
    private function handleVatPaidAccountUpdate(Request $request, Account $account): JsonResponse
    {
        DB::beginTransaction();
        
        \Log::info('=== ENTERED handleVatPaidAccountUpdate ===', [
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
            'vat_paid' => $vatPaid,
            'account8_debits' => $account8Debits,
            'account8_credits' => $account8Credits,
            'vat_available_for_credit' => $vatAvailableForCredit,
            'credit_amount' => $creditAmount
        ]);
        
        // Validate that credit amount doesn't exceed available VAT for credit
        if ($creditAmount > $vatAvailableForCredit) {
            DB::rollBack();
            return response()->json([
                'message' => "Credit amount ({$creditAmount}) cannot exceed available VAT for credit ({$vatAvailableForCredit}). VAT debited: {$account8Debits}, VAT credited: {$account8Credits}",
                'error' => 'Credit exceeds available VAT',
                'vat_debited' => $account8Debits,
                'vat_credited' => $account8Credits,
                'vat_available_for_credit' => $vatAvailableForCredit
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
        
        \Log::info('=== ACCOUNT 8 CREDIT COMPLETED ===', [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'credit_amount' => $creditAmount,
            'payment_order_number' => $paymentOrderNumber,
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
     * Update budget consumption based on payment amount
     */
    private function updateBudgetConsumption($paymentOrder, $paymentAmount)
    {
        \Log::info('=== UPDATE BUDGET CONSUMPTION METHOD CALLED ===', [
            'payment_order_id' => $paymentOrder->id,
            'payment_amount' => $paymentAmount,
            'method_started_at' => now()
        ]);
        
        try {
            // Get the purchase order linked to this payment order
            $purchaseOrder = \App\Models\PurchaseOrder::find($paymentOrder->purchase_order_id);
            
            if (!$purchaseOrder) {
                \Log::error('=== PURCHASE ORDER NOT FOUND ===', [
                    'payment_order_id' => $paymentOrder->id,
                    'purchase_order_id' => $paymentOrder->purchase_order_id
                ]);
                return;
            }

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

            // Normal scenario: Single budget update (split budget transfer happens on PO approval, not payment)
            \Log::info('=== UPDATING BUDGET CONSUMPTION FOR PAYMENT ===', [
                'payment_order_id' => $paymentOrder->id,
                'purchase_order_id' => $purchaseOrder->id,
                'request_budget_id' => $requestBudgetId,
                'payment_amount' => $paymentAmount,
                'po_total_amount' => $purchaseOrder->amount
            ]);

            // First, let's get the current budget values
            $currentBudget = DB::table('request_budgets')->where('id', $requestBudgetId)->first();
            if ($currentBudget) {
                \Log::info('=== CURRENT BUDGET VALUES ===', [
                    'request_budget_id' => $requestBudgetId,
                    'current_consumed_amount' => $currentBudget->consumed_amount,
                    'current_reserved_amount' => $currentBudget->reserved_amount,
                    'current_balance_amount' => $currentBudget->balance_amount
                ]);
            }

            // Calculate new values
            $newConsumedAmount = $currentBudget->consumed_amount + $paymentAmount;
            $newReservedAmount = $currentBudget->reserved_amount - $paymentAmount;

            \Log::info('=== CALCULATED NEW VALUES ===', [
                'new_consumed_amount' => $newConsumedAmount,
                'new_reserved_amount' => $newReservedAmount
            ]);

            $budgetUpdated = DB::table('request_budgets')
                ->where('id', $requestBudgetId)
                ->update([
                    'consumed_amount' => $newConsumedAmount,
                    'reserved_amount' => $newReservedAmount,
                    'updated_at' => now()
                ]);

            // Create audit log for budget consumption
            if ($budgetUpdated && $purchaseOrder) {
                // Calculate base amount (VAT excluded) - use PO amounts to calculate proportion
                $poBase = floatval($purchaseOrder->amount ?? 0);
                $poVat = floatval($purchaseOrder->vat_amount ?? 0);
                $poTotal = $poBase + $poVat;
                $basePaymentAmount = 0;
                if ($poTotal > 0) {
                    $proportion = $paymentAmount / $poTotal;
                    $basePaymentAmount = round($poBase * $proportion, 2);
                } else {
                    $basePaymentAmount = $paymentAmount;
                }

                DB::table('budget_audit_logs')->insert([
                    'request_budget_id' => $requestBudgetId,
                    'purchase_order_id' => $purchaseOrder->id,
                    'action' => 'consume',
                    'amount' => $basePaymentAmount,
                    'reserved_amount_before' => $currentBudget->reserved_amount,
                    'reserved_amount_after' => $newReservedAmount,
                    'balance_amount_before' => $currentBudget->balance_amount,
                    'balance_amount_after' => $currentBudget->balance_amount,
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
                'amount_added_to_consumed' => $paymentAmount,
                'amount_reduced_from_reserved' => $paymentAmount
            ]);

            // Log current budget status
            $budget = DB::table('request_budgets')->where('id', $requestBudgetId)->first();
            if ($budget) {
                \Log::info('=== CURRENT BUDGET STATUS AFTER PAYMENT ===', [
                    'request_budget_id' => $requestBudgetId,
                    'consumed_amount' => $budget->consumed_amount,
                    'reserved_amount' => $budget->reserved_amount,
                    'balance_amount' => $budget->balance_amount,
                    'update_was_successful' => ($budget->consumed_amount == $newConsumedAmount && $budget->reserved_amount == $newReservedAmount)
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

    /**
     * Retroactively link Purchase Orders to budgets for existing data
     * This method can be called to fix Purchase Orders that were created without budget links
     */
    public function linkPurchaseOrdersToBudgets(): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Find Purchase Orders without budget links
            $purchaseOrdersWithoutBudget = \App\Models\PurchaseOrder::whereNull('request_budget_id')
                ->whereNotNull('department_id')
                ->whereNotNull('cost_center_id')
                ->get();

            $linkedCount = 0;
            $notLinkedCount = 0;

            foreach ($purchaseOrdersWithoutBudget as $purchaseOrder) {
                // Try to find matching budget
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
                    $purchaseOrder->request_budget_id = $foundBudget->id;
                    $purchaseOrder->save();
                    $linkedCount++;
                    
                    \Log::info('=== LINKED PURCHASE ORDER TO BUDGET ===', [
                        'purchase_order_id' => $purchaseOrder->id,
                        'purchase_order_no' => $purchaseOrder->purchase_order_no,
                        'budget_id' => $foundBudget->id,
                        'department_id' => $purchaseOrder->department_id,
                        'cost_center_id' => $purchaseOrder->cost_center_id,
                        'sub_cost_center_id' => $purchaseOrder->sub_cost_center_id
                    ]);
                } else {
                    $notLinkedCount++;
                    
                    \Log::warning('=== COULD NOT LINK PURCHASE ORDER TO BUDGET ===', [
                        'purchase_order_id' => $purchaseOrder->id,
                        'purchase_order_no' => $purchaseOrder->purchase_order_no,
                        'department_id' => $purchaseOrder->department_id,
                        'cost_center_id' => $purchaseOrder->cost_center_id,
                        'sub_cost_center_id' => $purchaseOrder->sub_cost_center_id,
                        'fiscal_period_id' => $purchaseOrder->fiscal_period_id
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase Order budget linking completed',
                'data' => [
                    'total_processed' => $purchaseOrdersWithoutBudget->count(),
                    'successfully_linked' => $linkedCount,
                    'not_linked' => $notLinkedCount
                ]
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('=== ERROR LINKING PURCHASE ORDERS TO BUDGETS ===', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to link Purchase Orders to budgets',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
} 