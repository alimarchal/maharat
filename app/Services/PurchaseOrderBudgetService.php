<?php

namespace App\Services;

use App\Models\RequestBudget;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

class PurchaseOrderBudgetService
{
    /**
     * Check budget availability and reserve if available
     *
     * @param RequestBudget $budget
     * @param float $amount
     * @return bool
     */
    public function checkAndReserveBudget(RequestBudget $budget, float $amount): bool
    {
        // Check if there's enough balance
        if ($budget->balance_amount >= $amount) {
            return $budget->reserveBudget($amount);
        }

        return false;
    }

    /**
     * Release reserved budget when a PO is canceled
     *
     * @param PurchaseOrder $purchaseOrder
     * @return bool
     */
    public function releaseReservedBudget(PurchaseOrder $purchaseOrder): bool
    {
        $budget = $purchaseOrder->requestBudget;
        if ($budget) {
            return $budget->releaseReservedBudget($purchaseOrder->amount);
        }

        return false;
    }
}
