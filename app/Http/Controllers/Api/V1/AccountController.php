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
        $data = $request->validated();
        
        // For Liabilities account, only allow debit operations (reducing liabilities)
        if (isset($data['credit_amount']) && $data['credit_amount'] > 0) {
            return response()->json([
                'message' => 'Cannot credit Liabilities account. Only debit operations are allowed.',
                'error' => 'Credit operations are disabled for Liabilities account'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Check if debit amount is provided
        if (!isset($data['debit_amount']) || $data['debit_amount'] <= 0) {
            return response()->json([
                'message' => 'Debit amount is required and must be greater than 0 for Liabilities account.',
                'error' => 'Invalid debit amount'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Validate invoice number exists in invoices table
        if (!isset($data['invoice_number']) || empty($data['invoice_number'])) {
            return response()->json([
                'message' => 'Invoice number is required for Liabilities account debit operations.',
                'error' => 'Invoice number required'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Check if invoice exists in invoices table
        $invoice = \App\Models\Invoice::where('invoice_number', $data['invoice_number'])->first();
        if (!$invoice) {
            return response()->json([
                'message' => 'Invoice number not found in invoices table.',
                'error' => 'Invalid invoice number'
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $debitAmount = $data['debit_amount'];
        
        // Add 15% tax to the debit amount
        $taxAmount = $debitAmount * 0.15;
        $totalDebitAmount = $debitAmount + $taxAmount;

        // Update the account with the total debit amount
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
            "Liabilities payment for invoice {$data['invoice_number']} (Amount: {$debitAmount}, Tax: {$taxAmount})",
            $data['invoice_number'],
            now()->toDateString(),
            $data['attachment'] ?? null,
            $data['original_name'] ?? null
        );

        Log::info('=== LIABILITIES ACCOUNT DEBIT COMPLETED ===', [
            'account_id' => $account->id,
            'account_name' => $account->name,
            'debit_amount' => $debitAmount,
            'tax_amount' => $taxAmount,
            'total_debit_amount' => $totalDebitAmount,
            'invoice_number' => $data['invoice_number'],
            'invoice_id' => $invoice->id
        ]);

        DB::commit();

        return response()->json([
            'message' => 'Liabilities account updated successfully. Debit amount: ' . $debitAmount . ', Tax (15%): ' . $taxAmount . ', Total: ' . $totalDebitAmount,
            'data' => new AccountResource($account->load(['costCenter', 'creator', 'updater']))
        ], Response::HTTP_OK);
    }
} 