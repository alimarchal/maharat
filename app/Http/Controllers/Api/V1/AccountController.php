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

            // Special handling for Account ID 2 (Liabilities)
            if ($account->id == 2 && $account->name === 'Liabilities') {
                return $this->handleLiabilitiesAccountUpdate($request, $account, $originalCreditAmount);
            }

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
        // Proportional split
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
        // Record transaction flow for Liabilities (id 2)
        \App\Services\TransactionFlowService::recordTransactionFlow(
            2, // account_id
            'debit',
            $debitAmount,
            'liabilities_payment',
            $externalInvoice->id,
            [],
            "Liabilities payment for invoice {$externalInvoice->invoice_id} (Amount: {$netPaid}, Tax: {$taxPaid})",
            $data['invoice_number'],
            now()->toDateString(),
            $data['attachment'] ?? null,
            $data['original_name'] ?? null
        );
        // Record transaction flow for VAT Paid (id 8)
        if ($taxPaid > 0) {
            \App\Services\TransactionFlowService::recordTransactionFlow(
                8, // VAT Paid (on purchases)
                'credit',
                $taxPaid,
                'vat_paid',
                $externalInvoice->id,
                [],
                "VAT paid for invoice {$externalInvoice->invoice_id} (Tax: {$taxPaid})",
                $data['invoice_number'],
                now()->toDateString(),
                $data['attachment'] ?? null,
                $data['original_name'] ?? null
            );
        }
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
} 