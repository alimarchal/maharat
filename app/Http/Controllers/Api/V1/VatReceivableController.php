<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentOrder;
use App\Models\Account;
use App\Models\TransactionFlow;
use App\Models\ExternalInvoice;
use App\Services\TransactionFlowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Response;

class VatReceivableController extends Controller
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
     * Calculate total debits to Account 14 for a specific payment order
     * This includes both manual debits and any other debits linked to this payment order
     * When you debit Account 14, you're recording VAT as receivable, which reduces unpaid amount
     */
    private function calculateAccount14DebitsForPaymentOrder($paymentOrderNumber): float
    {
        // Get all debit transactions for Account 14 with this payment order number as reference
        $debits = TransactionFlow::where('account_id', 14)
            ->where('transaction_type', 'debit')
            ->where('reference_number', $paymentOrderNumber)
            ->sum('amount');
        
        return floatval($debits ?? 0);
    }
    
    /**
     * Calculate total credits to Account 14 for a specific payment order
     * Credits represent VAT refunds (reduces the receivable)
     */
    private function calculateAccount14CreditsForPaymentOrder($paymentOrderNumber): float
    {
        // Get all credit transactions for Account 14 with this payment order number as reference
        $credits = TransactionFlow::where('account_id', 14)
            ->where('transaction_type', 'credit')
            ->where('reference_number', $paymentOrderNumber)
            ->sum('amount');
        
        return floatval($credits ?? 0);
    }

    /**
     * Get list of payment orders with unpaid VAT (VAT not fully refunded)
     * These are the reference numbers that can be used for VAT refund entries
     * VAT unpaid = Actual VAT Paid - (Manual Debits to Account 14 + VAT Refunded via refund modal)
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
                    
                    // Calculate debits to Account 14 for this payment order (manual entries)
                    // When you debit Account 14, you're recording VAT as receivable, which reduces unpaid amount
                    $account14Debits = $this->calculateAccount14DebitsForPaymentOrder($po->payment_order_number);
                    
                    // Calculate credits to Account 14 for this payment order (refunds via refund modal)
                    $account14Credits = $this->calculateAccount14CreditsForPaymentOrder($po->payment_order_number);
                    
                    // Unpaid VAT = VAT paid - (debits to Account 14 + credits to Account 14)
                    // Both debits (manual entries) and credits (refunds) reduce the unpaid amount
                    $totalAccounted = $account14Debits + $account14Credits;
                    $vatUnpaid = $vatPaid - $totalAccounted;
                    
                    return [
                        'id' => $po->id,
                        'payment_order_number' => $po->payment_order_number,
                        'purchase_order_no' => $po->purchaseOrder->purchase_order_no ?? null,
                        'supplier_name' => $po->purchaseOrder->supplier->name ?? null,
                        'vat_amount' => floatval($po->vat_amount ?? 0), // Original VAT amount from PO
                        'vat_paid' => $vatPaid, // Actual VAT paid from payments
                        'vat_account14_debits' => $account14Debits, // Debits to Account 14 (manual entries)
                        'vat_account14_credits' => $account14Credits, // Credits to Account 14 (refunds)
                        'vat_unpaid_amount' => max(0, $vatUnpaid), // Ensure non-negative
                        'refund_status' => $totalAccounted == 0 ? 'Unpaid' : ($vatUnpaid > 0 ? 'Partially Paid' : 'Fully Paid'),
                        'issue_date' => $po->issue_date?->toDateString(),
                    ];
                })
                ->filter(function ($po) {
                    // Only return payment orders with unpaid VAT
                    return $po['vat_unpaid_amount'] > 0;
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $paymentOrders
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error('Failed to fetch VAT receivable payment orders', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch VAT receivable payment orders',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Record VAT refund from government
     * Credits Account 14 (VAT Receivable on Purchases) and Debits Cash
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'payment_order_number' => 'required|string|exists:payment_orders,payment_order_number',
            'refund_amount' => 'required|numeric|min:0.01',
            'refund_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'description' => 'nullable|string',
            'attachment' => 'nullable|file',
        ]);

        try {
            DB::beginTransaction();

            // Find payment order
            $paymentOrder = PaymentOrder::where('payment_order_number', $request->payment_order_number)->first();
            
            if (!$paymentOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment order not found'
                ], Response::HTTP_NOT_FOUND);
            }

            // Calculate actual VAT paid from transaction flows
            $vatPaid = $this->calculateActualVatPaid($paymentOrder);
            
            // Calculate debits to Account 14 for this payment order (manual entries)
            $account14Debits = $this->calculateAccount14DebitsForPaymentOrder($paymentOrder->payment_order_number);
            
            // Calculate credits to Account 14 for this payment order (refunds)
            $account14Credits = $this->calculateAccount14CreditsForPaymentOrder($paymentOrder->payment_order_number);
            
            // Total accounted for = debits + credits
            $totalAccounted = $account14Debits + $account14Credits;
            
            // Unpaid VAT = VAT paid - total accounted for
            $vatUnpaid = $vatPaid - $totalAccounted;
            $refundAmount = floatval($request->refund_amount);

            // Validate refund amount doesn't exceed unpaid VAT (based on actual VAT paid)
            if ($refundAmount > $vatUnpaid) {
                return response()->json([
                    'success' => false,
                    'message' => "Refund amount ({$refundAmount}) cannot exceed unpaid VAT amount ({$vatUnpaid}). Actual VAT paid: {$vatPaid}, VAT refunded: {$vatRefunded}",
                    'vat_paid' => $vatPaid,
                    'vat_refunded' => $vatRefunded,
                    'vat_unpaid' => $vatUnpaid,
                    'refund_amount' => $refundAmount
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            
            // Validate that VAT was actually paid
            if ($vatPaid <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => "No VAT has been paid for this payment order yet. Cannot refund VAT that hasn't been paid.",
                    'vat_paid' => $vatPaid
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Handle file upload if present
            $attachmentPath = null;
            $originalName = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $attachmentPath = $file->storeAs('vat_refunds', $fileName, 'public');
                $originalName = $file->getClientOriginalName();
            }

            // Update payment order VAT refunded amount
            $newVatRefunded = $vatRefunded + $refundAmount;
            $paymentOrder->vat_refunded_amount = $newVatRefunded;
            $paymentOrder->save();

            // Get Account 14 (VAT Receivable on Purchases)
            $vatReceivableAccount = Account::find(14);
            if (!$vatReceivableAccount) {
                throw new \Exception('Account 14 (VAT Receivable on Purchases) not found. Please run the seeder.');
            }

            // Get Cash Account (ID 12)
            $cashAccount = Account::find(12);
            if (!$cashAccount) {
                throw new \Exception('Cash account (ID 12) not found.');
            }

            // Credit Account 14 (VAT Receivable) - reduces the receivable
            $vatReceivableAccount->credit_amount = ($vatReceivableAccount->credit_amount ?? 0) + $refundAmount;
            $vatReceivableAccount->save();

            // Debit Cash Account (ID 12) - increases cash
            $cashAccount->debit_amount = ($cashAccount->debit_amount ?? 0) + $refundAmount;
            $cashAccount->save();

            // Record transaction flow for Account 14 (VAT Receivable)
            TransactionFlowService::recordTransactionFlow(
                14, // Account ID
                'credit',
                $refundAmount,
                'vat_refund',
                $paymentOrder->id,
                [],
                $request->description ?? "VAT refund received from government for payment order {$paymentOrder->payment_order_number}",
                $request->reference_number ?? $paymentOrder->payment_order_number,
                $request->refund_date,
                $attachmentPath,
                $originalName
            );

            // Record transaction flow for Cash Account
            TransactionFlowService::recordTransactionFlow(
                12, // Cash Account ID
                'debit',
                $refundAmount,
                'vat_refund',
                $paymentOrder->id,
                [],
                "Cash received from VAT refund for payment order {$paymentOrder->payment_order_number}",
                $request->reference_number ?? $paymentOrder->payment_order_number,
                $request->refund_date,
                $attachmentPath,
                $originalName
            );

            DB::commit();

            Log::info('VAT refund recorded successfully', [
                'payment_order_id' => $paymentOrder->id,
                'payment_order_number' => $paymentOrder->payment_order_number,
                'vat_paid' => $vatPaid,
                'refund_amount' => $refundAmount,
                'vat_refunded_total' => $newVatRefunded,
                'vat_unpaid_remaining' => $vatUnpaid - $refundAmount
            ]);

            return response()->json([
                'success' => true,
                'message' => 'VAT refund recorded successfully',
                'data' => [
                    'payment_order_number' => $paymentOrder->payment_order_number,
                    'vat_paid' => $vatPaid,
                    'refund_amount' => $refundAmount,
                    'vat_refunded_total' => $newVatRefunded,
                    'vat_unpaid_remaining' => $vatUnpaid - $refundAmount,
                    'refund_status' => ($vatUnpaid - $refundAmount) <= 0 ? 'Fully Paid' : 'Partially Paid'
                ]
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to record VAT refund', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to record VAT refund',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
