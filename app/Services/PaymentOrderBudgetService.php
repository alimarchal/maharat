<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\PaymentOrder;

class PaymentOrderBudgetService
{
    /**
     * Consume budget for a payment order
     *
     * @param PaymentOrder $paymentOrder
     * @param float $amount
     * @return bool
     */
    public function consumeBudget(PaymentOrder $paymentOrder, float $amount): bool
    {
        // Check if payment order is linked to a purchase order with a budget
        if ($paymentOrder->purchase_order_id) {
            $purchaseOrder = $paymentOrder->purchaseOrder;

            if ($purchaseOrder && $purchaseOrder->request_budget_id) {
                $budget = $purchaseOrder->requestBudget;

                // Consume from the reserved amount
                return $budget->consumeBudget($amount);
            }
        }

        return true; // Return true if there's no budget to consume from
    }
}
