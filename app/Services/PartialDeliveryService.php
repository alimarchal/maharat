<?php

namespace App\Services;

use App\Models\Grn;
use App\Models\PurchaseOrder;
use App\Models\ExternalInvoice;
use App\Models\PaymentOrder;
use App\Models\RequestBudget;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PartialDeliveryService
{
    /**
     * Handle partial delivery adjustment
     */
    public function handlePartialDeliveryAdjustment(Grn $grn, string $action, ?string $notes = null)
    {
        DB::beginTransaction();
        
        try {
            if ($action === 'expect_later') {
                $this->handleExpectLaterDelivery($grn, $notes);
            } elseif ($action === 'adjust_close') {
                $this->handleAdjustAndClose($grn, $notes);
            } else {
                throw new \InvalidArgumentException('Invalid action. Must be "expect_later" or "adjust_close"');
            }
            
            DB::commit();
            Log::info('Partial delivery adjustment completed successfully', [
                'grn_id' => $grn->id,
                'action' => $action
            ]);
            
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Partial delivery adjustment failed', [
                'grn_id' => $grn->id,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Handle "Expect Later Delivery" action
     */
    private function handleExpectLaterDelivery(Grn $grn, ?string $notes = null)
    {
        $grn->update([
            'delivery_status' => 'awaiting_remaining',
            'delivery_notes' => $notes
        ]);
        
        Log::info('GRN set to awaiting remaining delivery', [
            'grn_id' => $grn->id,
            'expected_quantity' => $grn->expected_quantity,
            'delivered_quantity' => $grn->quantity,
            'shortage' => $grn->getShortageQuantity()
        ]);
    }

    /**
     * Handle "Adjust & Close" action
     */
    private function handleAdjustAndClose(Grn $grn, ?string $notes = null)
    {
        $purchaseOrder = $grn->purchaseOrder;
        if (!$purchaseOrder) {
            throw new \Exception('Purchase order not found for GRN');
        }

        // Calculate shortage amount with 15% VAT
        $shortageQuantity = $grn->getShortageQuantity();
        $unitPrice = $this->getUnitPriceFromPurchaseOrder($purchaseOrder);
        $shortageAmount = $shortageQuantity * $unitPrice;
        $shortageVat = $shortageAmount * 0.15; // 15% VAT
        $totalShortageAmount = $shortageAmount + $shortageVat;

        // Update GRN status
        $grn->update([
            'delivery_status' => 'partial',
            'delivery_notes' => $notes
        ]);

        // Update Purchase Order
        $purchaseOrder->update([
            'adjust_amount' => $totalShortageAmount
        ]);
        $purchaseOrder->updateTotalAmount();

        // Update External Invoice if exists
        $this->updateExternalInvoice($purchaseOrder, $totalShortageAmount);

        // Update Payment Order if exists
        $this->updatePaymentOrder($purchaseOrder, $totalShortageAmount);

        // Update Request Budget
        $this->updateRequestBudget($purchaseOrder, $totalShortageAmount);

        Log::info('Adjust and close completed', [
            'grn_id' => $grn->id,
            'purchase_order_id' => $purchaseOrder->id,
            'shortage_quantity' => $shortageQuantity,
            'shortage_amount' => $shortageAmount,
            'shortage_vat' => $shortageVat,
            'total_shortage_amount' => $totalShortageAmount
        ]);
    }

    /**
     * Get unit price from purchase order
     */
    private function getUnitPriceFromPurchaseOrder(PurchaseOrder $purchaseOrder): float
    {
        // Get unit price from quotation items via RFQ items
        $quotation = $purchaseOrder->quotation;
        if ($quotation && $quotation->quotationItems()->exists()) {
            $totalPrice = $quotation->quotationItems()->sum('total_price');
            // Get total quantity from RFQ items
            $rfq = $quotation->rfq;
            if ($rfq && $rfq->rfqItems()->exists()) {
                $totalQuantity = $rfq->rfqItems()->sum('quantity') ?? 1;
                return $totalPrice / $totalQuantity;
            }
        }

        // Fallback: calculate from purchase order amount
        $expectedQuantity = $purchaseOrder->goodReceiveNote()->sum('expected_quantity') ?: 1;
        return $purchaseOrder->amount / $expectedQuantity;
    }

    /**
     * Update External Invoice if it exists
     */
    private function updateExternalInvoice(PurchaseOrder $purchaseOrder, float $adjustmentAmount)
    {
        $externalInvoice = $purchaseOrder->externalInvoice;
        if ($externalInvoice) {
            $externalInvoice->update([
                'amount' => $purchaseOrder->total_amount,
                'vat_amount' => $purchaseOrder->vat_amount - ($adjustmentAmount * 0.15 / 1.15)
            ]);
            
            Log::info('External invoice updated', [
                'invoice_id' => $externalInvoice->id,
                'new_amount' => $externalInvoice->amount,
                'adjustment' => $adjustmentAmount
            ]);
        }
    }

    /**
     * Update Payment Order if it exists
     */
    private function updatePaymentOrder(PurchaseOrder $purchaseOrder, float $adjustmentAmount)
    {
        $paymentOrders = $purchaseOrder->paymentOrders;
        foreach ($paymentOrders as $paymentOrder) {
            $paymentOrder->update([
                'total_amount' => $purchaseOrder->total_amount,
                'vat_amount' => $purchaseOrder->vat_amount - ($adjustmentAmount * 0.15 / 1.15)
            ]);
            
            Log::info('Payment order updated', [
                'payment_order_id' => $paymentOrder->id,
                'new_amount' => $paymentOrder->total_amount,
                'adjustment' => $adjustmentAmount
            ]);
        }
    }

    /**
     * Update Request Budget
     */
    private function updateRequestBudget(PurchaseOrder $purchaseOrder, float $adjustmentAmount)
    {
        $requestBudget = $purchaseOrder->requestBudget;
        if ($requestBudget) {
            // Move adjustment amount from reserved to balance
            $requestBudget->update([
                'reserved_amount' => $requestBudget->reserved_amount - $adjustmentAmount,
                'balance_amount' => $requestBudget->balance_amount + $adjustmentAmount
            ]);
            
            Log::info('Request budget updated', [
                'budget_id' => $requestBudget->id,
                'adjustment' => $adjustmentAmount,
                'new_reserved' => $requestBudget->reserved_amount,
                'new_balance' => $requestBudget->balance_amount
            ]);
        }
    }

    /**
     * Add additional delivery to existing GRN
     */
    public function addAdditionalDelivery(Grn $grn, float $additionalQuantity, ?string $notes = null)
    {
        DB::beginTransaction();
        
        try {
            $newTotalQuantity = $grn->quantity + $additionalQuantity;
            $remainingQuantity = $grn->expected_quantity - $newTotalQuantity;
            
            $grn->update([
                'quantity' => $newTotalQuantity,
                'delivery_status' => $remainingQuantity <= 0 ? 'complete' : 'awaiting_remaining',
                'delivery_notes' => $notes
            ]);

            // If delivery is now complete, reset any adjustments
            if ($remainingQuantity <= 0) {
                $this->resetAdjustments($grn);
            }
            
            DB::commit();
            
            Log::info('Additional delivery added', [
                'grn_id' => $grn->id,
                'additional_quantity' => $additionalQuantity,
                'new_total_quantity' => $newTotalQuantity,
                'remaining_quantity' => $remainingQuantity
            ]);
            
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Additional delivery failed', [
                'grn_id' => $grn->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Reset adjustments when delivery is completed
     */
    private function resetAdjustments(Grn $grn)
    {
        $purchaseOrder = $grn->purchaseOrder;
        if (!$purchaseOrder) {
            return;
        }

        // Reset purchase order adjustments
        $purchaseOrder->update([
            'adjust_amount' => 0
        ]);
        $purchaseOrder->updateTotalAmount();

        // Reset external invoice
        $externalInvoice = $purchaseOrder->externalInvoice;
        if ($externalInvoice) {
            $externalInvoice->update([
                'amount' => $purchaseOrder->amount,
                'vat_amount' => $purchaseOrder->vat_amount
            ]);
        }

        // Reset payment orders
        foreach ($purchaseOrder->paymentOrders as $paymentOrder) {
            $paymentOrder->update([
                'total_amount' => $purchaseOrder->amount + $purchaseOrder->vat_amount,
                'vat_amount' => $purchaseOrder->vat_amount
            ]);
        }

        // Reset request budget
        $requestBudget = $purchaseOrder->requestBudget;
        if ($requestBudget) {
            $adjustmentAmount = $purchaseOrder->adjust_amount;
            $requestBudget->update([
                'reserved_amount' => $requestBudget->reserved_amount + $adjustmentAmount,
                'balance_amount' => $requestBudget->balance_amount - $adjustmentAmount
            ]);
        }
    }
}
