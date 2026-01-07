<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentOrder;
use App\Models\TransactionFlow;
use App\Models\ExternalInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Response;

class VatPaidController extends Controller
{
    /**
     * Calculate actual VAT paid for a payment order from transaction flows
     * VAT is paid proportionally with each payment
     */
    private function calculateActualVatPaid($paymentOrder): float
    {
        // Get external invoice for this payment order
        $externalInvoice = ExternalInvoice::where('purchase_order_id', $paymentOrder->purchase_order_id)
            ->whereNull('deleted_at')
            ->first();
        
        if (!$externalInvoice) {
            return 0;
        }
        
        $invoiceBase = floatval($externalInvoice->amount ?? 0);
        $invoiceVat = floatval($externalInvoice->vat_amount ?? 0);
        $invoiceTotal = $invoiceBase + $invoiceVat;
        
        if ($invoiceTotal <= 0) {
            return 0;
        }
        
        // Get all payment transactions for this payment order from Account 2 (Liabilities)
        $paymentTransactions = TransactionFlow::where('account_id', 2)
            ->where('reference_number', $paymentOrder->payment_order_number)
            ->where('transaction_type', 'debit')
            ->where('related_entity_type', 'liabilities_payment')
            ->get();
        
        $totalVatPaid = 0;
        
        foreach ($paymentTransactions as $transaction) {
            $paymentAmount = floatval($transaction->amount ?? 0);
            // Calculate VAT portion of this payment proportionally
            $proportion = $paymentAmount / $invoiceTotal;
            $vatPortion = round($invoiceVat * $proportion, 2);
            $totalVatPaid += $vatPortion;
        }
        
        return round($totalVatPaid, 2);
    }

    /**
     * Calculate total debits to Account 8 for a specific payment order
     * Debits represent VAT paid (increases VAT expense)
     * Uses payment order number as reference to match transaction flows
     */
    private function calculateAccount8DebitsForPaymentOrder($paymentOrderNumber): float
    {
        // Find all debit transactions for Account 8 with this payment order number
        // Use case-insensitive and trimmed comparison to ensure we catch all matches
        $paymentOrderNumberTrimmed = trim($paymentOrderNumber);
        
        $debits = TransactionFlow::where('account_id', 8)
            ->where('transaction_type', 'debit')
            ->whereRaw('LOWER(TRIM(reference_number)) = ?', [strtolower($paymentOrderNumberTrimmed)])
            ->sum('amount');
        
        $result = floatval($debits ?? 0);
        
        // Log for debugging
        \Log::info('Account 8 debits calculation', [
            'payment_order_number' => $paymentOrderNumber,
            'payment_order_number_trimmed' => $paymentOrderNumberTrimmed,
            'debits_found' => $debits,
            'result' => $result
        ]);
        
        return $result;
    }

    /**
     * Calculate total credits to Account 8 for a specific payment order
     * Credits represent VAT refunds from government (reduces VAT expense)
     * This includes all credit transactions recorded in the transaction flows
     */
    private function calculateAccount8CreditsForPaymentOrder($paymentOrderNumber): float
    {
        // Find all credit transactions for Account 8 with this payment order number
        // Use case-insensitive and trimmed comparison to ensure we catch all matches
        $paymentOrderNumberTrimmed = trim($paymentOrderNumber);
        
        $credits = TransactionFlow::where('account_id', 8)
            ->where('transaction_type', 'credit')
            ->whereRaw('LOWER(TRIM(reference_number)) = ?', [strtolower($paymentOrderNumberTrimmed)])
            ->sum('amount');
        
        $result = floatval($credits ?? 0);
        
        // Get all matching transactions for debugging
        $matchingTransactions = TransactionFlow::where('account_id', 8)
            ->where('transaction_type', 'credit')
            ->whereRaw('LOWER(TRIM(reference_number)) = ?', [strtolower($paymentOrderNumberTrimmed)])
            ->select('id', 'reference_number', 'amount', 'transaction_date')
            ->get();
        
        // Log for debugging
        \Log::info('Account 8 credits calculation', [
            'payment_order_number' => $paymentOrderNumber,
            'payment_order_number_trimmed' => $paymentOrderNumberTrimmed,
            'credits_found' => $credits,
            'result' => $result,
            'matching_transactions_count' => $matchingTransactions->count(),
            'matching_transactions' => $matchingTransactions->map(function($t) {
                return [
                    'id' => $t->id,
                    'reference_number' => $t->reference_number,
                    'amount' => $t->amount,
                    'transaction_date' => $t->transaction_date
                ];
            })->toArray()
        ]);
        
        return $result;
    }

    /**
     * Get list of payment orders with VAT that can be credited (refunded)
     * VAT available for credit = VAT Paid (debits) - VAT Refunded (credits)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $paymentOrders = PaymentOrder::with(['purchaseOrder', 'purchaseOrder.supplier'])
                ->where('vat_amount', '>', 0)
                ->get()
                ->map(function ($po) {
                    // Calculate actual VAT paid from transaction flows
                    $vatPaid = $this->calculateActualVatPaid($po);
                    
                    // Calculate debits to Account 8 for this payment order (VAT paid)
                    // This is the actual amount debited to Account 8 from transaction flows
                    $account8Debits = $this->calculateAccount8DebitsForPaymentOrder($po->payment_order_number);
                    
                    // Calculate credits to Account 8 for this payment order (VAT refunded)
                    $account8Credits = $this->calculateAccount8CreditsForPaymentOrder($po->payment_order_number);
                    
                    // VAT available for credit = VAT debited to Account 8 - VAT credited from Account 8
                    // This ensures we only allow crediting what was actually debited
                    $vatAvailableForCredit = $account8Debits - $account8Credits;
                    
                    // Log for debugging
                    \Log::info('VAT Paid calculation for payment order', [
                        'payment_order_number' => $po->payment_order_number,
                        'vat_paid_calculated' => $vatPaid,
                        'account8_debits' => $account8Debits,
                        'account8_credits' => $account8Credits,
                        'vat_available_for_credit' => $vatAvailableForCredit
                    ]);
                    
                    return [
                        'payment_order_number' => $po->payment_order_number,
                        'purchase_order_no' => $po->purchaseOrder->purchase_order_no ?? null,
                        'supplier_name' => $po->purchaseOrder->supplier->name ?? null,
                        'vat_amount' => floatval($po->vat_amount ?? 0), // Original VAT amount from PO
                        'vat_paid' => $vatPaid, // Actual VAT paid from payments
                        'vat_debited' => $account8Debits, // Debits to Account 8 (VAT paid)
                        'vat_credited' => $account8Credits, // Credits to Account 8 (VAT refunded)
                        'vat_available_for_credit' => max(0, $vatAvailableForCredit), // Ensure non-negative
                        'refund_status' => $account8Credits == 0 ? 'Not Refunded' : ($vatAvailableForCredit > 0 ? 'Partially Refunded' : 'Fully Refunded'),
                        'issue_date' => $po->issue_date?->toDateString(),
                    ];
                })
                ->filter(function ($po) {
                    // Only return payment orders with VAT available for credit
                    return $po['vat_available_for_credit'] > 0;
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $paymentOrders
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error('Failed to fetch VAT paid payment orders', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch VAT paid payment orders',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}

