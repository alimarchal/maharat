<?php

namespace App\Services;

use App\Models\RequestBudget;
use App\Models\PurchaseOrder;
use App\Models\Budget;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class VatBudgetService
{
    /**
     * Get the approved VAT budget for a given fiscal period (one per year/period).
     *
     * IMPORTANT:
     * - RequestBudget (type = 'vat') must be Approved
     * - AND its corresponding total Budget record must be Active
     *   (Total Budget Approval must be completed)
     */
    public function getApprovedVatBudgetForFiscalPeriod(int $fiscalPeriodId): ?RequestBudget
    {
        // First, get the approved VAT RequestBudget for this fiscal period
        $vatRequestBudget = RequestBudget::where('fiscal_period_id', $fiscalPeriodId)
            ->where('type', 'vat')
            ->where('status', 'Approved')
            ->first();

        if (!$vatRequestBudget) {
            return null;
        }

        // Now verify that there is an Active Budget linked to this request_budget_id
        $hasActiveTotalBudget = Budget::where('request_budget_id', $vatRequestBudget->id)
            ->where('status', 'Active')
            ->exists();

        if (!$hasActiveTotalBudget) {
            Log::warning('VAT budget request is approved but total budget is not Active yet. VAT budget not considered usable.', [
                'fiscal_period_id' => $fiscalPeriodId,
                'vat_request_budget_id' => $vatRequestBudget->id,
            ]);
            return null;
        }

        return $vatRequestBudget;
    }

    /**
     * Calculate available VAT capacity on a VAT budget.
     */
    public function getAvailableVatCapacity(RequestBudget $vatBudget): float
    {
        $approved = (float) ($vatBudget->approved_amount ?? 0);
        $reserved = (float) ($vatBudget->reserved_amount ?? 0);
        $consumed = (float) ($vatBudget->consumed_amount ?? 0);

        return max(0, $approved - $reserved - $consumed);
    }

    /**
     * Reserve VAT for a new purchase order.
     *
     * @return int|null The audit log ID if created, null if no VAT amount
     * @throws \Exception if no VAT budget found or insufficient capacity
     */
    public function reserveVatForPurchaseOrder(int $fiscalPeriodId, float $vatAmount): ?int
    {
        $vatAmount = round($vatAmount, 2);

        if ($vatAmount <= 0) {
            return null;
        }

        $vatBudget = $this->getApprovedVatBudgetForFiscalPeriod($fiscalPeriodId);

        if (!$vatBudget) {
            throw new \Exception('No approved VAT budget found for the selected fiscal period. Cannot reserve VAT.');
        }

        $available = $this->getAvailableVatCapacity($vatBudget);

        if ($available < $vatAmount) {
            throw new \Exception("Insufficient VAT budget. Available: {$available}, Required: {$vatAmount}");
        }

        $beforeReserved = (float) $vatBudget->reserved_amount;
        $beforeBalance  = (float) $vatBudget->balance_amount;

        $vatBudget->reserved_amount = $beforeReserved + $vatAmount;
        // Keep balance_amount in sync only for VAT budgets
        $vatBudget->balance_amount = $this->getAvailableVatCapacity($vatBudget);
        $vatBudget->save();

        // Audit log: VAT reserved against yearly VAT budget
        $auditLogId = DB::table('budget_audit_logs')->insertGetId([
            'request_budget_id'        => $vatBudget->id,
            'purchase_order_id'        => null, // Will be updated after PO creation
            'action'                   => 'reserve',
            'amount'                   => $vatAmount,
            'approved_amount_before'   => null,
            'approved_amount_after'    => null,
            'reserved_amount_before'   => $beforeReserved,
            'reserved_amount_after'    => $vatBudget->reserved_amount,
            'balance_amount_before'    => $beforeBalance,
            'balance_amount_after'     => $vatBudget->balance_amount,
            'notes'                    => "VAT reserved from yearly VAT budget for fiscal period ID {$fiscalPeriodId}.",
            'created_by'               => auth()->id(),
            'created_at'               => now(),
            'updated_at'               => now(),
        ]);

        Log::info('VAT reserved for purchase order', [
            'fiscal_period_id' => $fiscalPeriodId,
            'vat_budget_id'    => $vatBudget->id,
            'reserved_before'  => $beforeReserved,
            'reserved_after'   => $vatBudget->reserved_amount,
            'vat_reserved'     => $vatAmount,
            'audit_log_id'     => $auditLogId,
        ]);

        return $auditLogId;
    }

    /**
     * Adjust VAT reservation when a GRN "adjust and close" changes the PO VAT amount.
     *
     * Uses original_vat_amount and current vat_amount on the purchase order.
     *
     * @throws \Exception if increasing VAT and capacity is not sufficient.
     */
    public function adjustVatReservationForPurchaseOrder(PurchaseOrder $purchaseOrder): void
    {
        $originalVat = (float) ($purchaseOrder->original_vat_amount ?? 0);
        $newVat      = (float) ($purchaseOrder->vat_amount ?? 0);

        if ($originalVat == $newVat) {
            return;
        }

        $delta = round($originalVat - $newVat, 2);

        $vatBudget = $this->getApprovedVatBudgetForFiscalPeriod((int) $purchaseOrder->fiscal_period_id);

        if (!$vatBudget) {
            // If there is no VAT budget at this point, just log and bail out instead of throwing
            Log::warning('No VAT budget found while trying to adjust VAT reservation for PO', [
                'purchase_order_id' => $purchaseOrder->id,
                'fiscal_period_id'  => $purchaseOrder->fiscal_period_id,
            ]);
            return;
        }

        // If delta > 0, PO VAT decreased → release reservation.
        if ($delta > 0) {
            $beforeReserved = (float) $vatBudget->reserved_amount;
            $beforeBalance  = (float) $vatBudget->balance_amount;

            $vatBudget->reserved_amount = max(0, $beforeReserved - $delta);
            $vatBudget->balance_amount  = $this->getAvailableVatCapacity($vatBudget);
            $vatBudget->save();

            // Audit log: VAT reservation released after GRN adjustment
            DB::table('budget_audit_logs')->insert([
                'request_budget_id'        => $vatBudget->id,
                'purchase_order_id'        => $purchaseOrder->id,
                'action'                   => 'release',
                'amount'                   => $delta,
                'approved_amount_before'   => null,
                'approved_amount_after'    => null,
                'reserved_amount_before'   => $beforeReserved,
                'reserved_amount_after'    => $vatBudget->reserved_amount,
                'balance_amount_before'    => $beforeBalance,
                'balance_amount_after'     => $vatBudget->balance_amount,
                'notes'                    => "GRN adjustment for PO {$purchaseOrder->purchase_order_no}: VAT decreased from {$originalVat} to {$newVat}.",
                'created_by'               => auth()->id(),
                'created_at'               => now(),
                'updated_at'               => now(),
            ]);

            Log::info('VAT reservation released after GRN adjustment', [
                'purchase_order_id' => $purchaseOrder->id,
                'original_vat'      => $originalVat,
                'new_vat'           => $newVat,
                'released'          => $delta,
                'reserved_before'   => $beforeReserved,
                'reserved_after'    => $vatBudget->reserved_amount,
            ]);
        } elseif ($delta < 0) {
            // PO VAT increased → need to reserve additional VAT (delta is negative here).
            $extraRequired = abs($delta);
            $available     = $this->getAvailableVatCapacity($vatBudget);

            if ($available < $extraRequired) {
                throw new \Exception("Insufficient VAT budget to increase PO VAT after adjustment. Available: {$available}, Required: {$extraRequired}");
            }

            $beforeReserved = (float) $vatBudget->reserved_amount;
            $beforeBalance  = (float) $vatBudget->balance_amount;

            $vatBudget->reserved_amount = $beforeReserved + $extraRequired;
            $vatBudget->balance_amount  = $this->getAvailableVatCapacity($vatBudget);
            $vatBudget->save();

            // Audit log: additional VAT reserved after GRN adjustment
            DB::table('budget_audit_logs')->insert([
                'request_budget_id'        => $vatBudget->id,
                'purchase_order_id'        => $purchaseOrder->id,
                'action'                   => 'reserve',
                'amount'                   => $extraRequired,
                'approved_amount_before'   => null,
                'approved_amount_after'    => null,
                'reserved_amount_before'   => $beforeReserved,
                'reserved_amount_after'    => $vatBudget->reserved_amount,
                'balance_amount_before'    => $beforeBalance,
                'balance_amount_after'     => $vatBudget->balance_amount,
                'notes'                    => "GRN adjustment for PO {$purchaseOrder->purchase_order_no}: VAT increased from {$originalVat} to {$newVat}.",
                'created_by'               => auth()->id(),
                'created_at'               => now(),
                'updated_at'               => now(),
            ]);

            Log::info('Additional VAT reserved after GRN adjustment', [
                'purchase_order_id' => $purchaseOrder->id,
                'original_vat'      => $originalVat,
                'new_vat'           => $newVat,
                'extra_reserved'    => $extraRequired,
                'reserved_before'   => $beforeReserved,
                'reserved_after'    => $vatBudget->reserved_amount,
            ]);
        }
    }

    /**
     * Move VAT from reserved → consumed when a payment is made.
     *
     * $vatPaymentAmount is the VAT portion of this payment.
     */
    public function consumeVatOnPayment(PurchaseOrder $purchaseOrder, float $vatPaymentAmount): void
    {
        $vatPaymentAmount = round($vatPaymentAmount, 2);

        if ($vatPaymentAmount <= 0) {
            return;
        }

        $vatBudget = $this->getApprovedVatBudgetForFiscalPeriod((int) $purchaseOrder->fiscal_period_id);

        if (!$vatBudget) {
            Log::warning('No VAT budget found while trying to consume VAT on payment', [
                'purchase_order_id' => $purchaseOrder->id,
                'fiscal_period_id'  => $purchaseOrder->fiscal_period_id,
                'vat_payment'       => $vatPaymentAmount,
            ]);
            return;
        }

        $beforeReserved = (float) $vatBudget->reserved_amount;
        $beforeConsumed = (float) $vatBudget->consumed_amount;
        $beforeBalance  = (float) $vatBudget->balance_amount;

        // Do not allow reserved to go below zero
        $decrease = min($vatPaymentAmount, $beforeReserved);

        $vatBudget->reserved_amount = max(0, $beforeReserved - $decrease);
        $vatBudget->consumed_amount = $beforeConsumed + $vatPaymentAmount;
        $vatBudget->balance_amount  = $this->getAvailableVatCapacity($vatBudget);
        $vatBudget->save();

        // Audit log: VAT consumed on AP payment
        DB::table('budget_audit_logs')->insert([
            'request_budget_id'        => $vatBudget->id,
            'purchase_order_id'        => $purchaseOrder->id,
            'action'                   => 'consume',
            'amount'                   => $vatPaymentAmount,
            'approved_amount_before'   => null,
            'approved_amount_after'    => null,
            'reserved_amount_before'   => $beforeReserved,
            'reserved_amount_after'    => $vatBudget->reserved_amount,
            'balance_amount_before'    => $beforeBalance,
            'balance_amount_after'     => $vatBudget->balance_amount,
            'notes'                    => "VAT consumed on payment for PO {$purchaseOrder->purchase_order_no}.",
            'created_by'               => auth()->id(),
            'created_at'               => now(),
            'updated_at'               => now(),
        ]);

        Log::info('VAT consumed on payment', [
            'purchase_order_id'  => $purchaseOrder->id,
            'vat_payment'        => $vatPaymentAmount,
            'reserved_before'    => $beforeReserved,
            'reserved_after'     => $vatBudget->reserved_amount,
            'consumed_before'    => $beforeConsumed,
            'consumed_after'     => $vatBudget->consumed_amount,
        ]);
    }

    /**
     * When VAT is credited back in Account 8, reduce consumed VAT to restore capacity.
     */
    public function refundVatOnCredit(PurchaseOrder $purchaseOrder, float $vatCreditAmount): void
    {
        $vatCreditAmount = round($vatCreditAmount, 2);

        if ($vatCreditAmount <= 0) {
            return;
        }

        $vatBudget = $this->getApprovedVatBudgetForFiscalPeriod((int) $purchaseOrder->fiscal_period_id);

        if (!$vatBudget) {
            Log::warning('No VAT budget found while trying to refund VAT on credit', [
                'purchase_order_id' => $purchaseOrder->id,
                'fiscal_period_id'  => $purchaseOrder->fiscal_period_id,
                'vat_credit'        => $vatCreditAmount,
            ]);
            return;
        }

        $beforeConsumed = (float) $vatBudget->consumed_amount;
        $beforeReserved = (float) $vatBudget->reserved_amount;
        $beforeBalance  = (float) $vatBudget->balance_amount;

        $decrease = min($vatCreditAmount, $beforeConsumed);

        $vatBudget->consumed_amount = max(0, $beforeConsumed - $decrease);
        $vatBudget->balance_amount  = $this->getAvailableVatCapacity($vatBudget);
        $vatBudget->save();

        // Audit log: VAT refunded/credited back to VAT budget
        // Note: This affects consumed_amount, but we record reserved_amount for display consistency
        DB::table('budget_audit_logs')->insert([
            'request_budget_id'        => $vatBudget->id,
            'purchase_order_id'        => $purchaseOrder->id,
            'action'                   => 'release',
            'amount'                   => $vatCreditAmount,
            'approved_amount_before'   => null,
            'approved_amount_after'    => null,
            'reserved_amount_before'   => $beforeReserved,
            'reserved_amount_after'    => $vatBudget->reserved_amount, // Reserved doesn't change, but show current value
            'balance_amount_before'    => $beforeBalance,
            'balance_amount_after'     => $vatBudget->balance_amount,
            'notes'                    => "VAT credited back from government for PO {$purchaseOrder->purchase_order_no}.",
            'created_by'               => auth()->id(),
            'created_at'               => now(),
            'updated_at'               => now(),
        ]);

        Log::info('VAT refunded (credit) and removed from consumed VAT budget', [
            'purchase_order_id' => $purchaseOrder->id,
            'vat_credit'        => $vatCreditAmount,
            'consumed_before'   => $beforeConsumed,
            'consumed_after'    => $vatBudget->consumed_amount,
        ]);
    }
}


