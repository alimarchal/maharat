<?php

namespace App\Services;

use App\Models\FiscalPeriod;
use App\Models\RequestBudget;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BudgetValidationService
{
    /**
     * Get applicable fiscal periods for a given date
     */
    public function getApplicableFiscalPeriods($date)
    {
        try {
            $dateObj = Carbon::parse($date);
            
            \Log::info('BudgetValidationService: Searching for fiscal periods for date: ' . $date);
            
            $periods = FiscalPeriod::where('start_date', '<=', $dateObj)
                ->where('end_date', '>=', $dateObj)
                ->orderBy(DB::raw('(end_date - start_date)'), 'asc') // Most specific first
                ->get();
                
            \Log::info('BudgetValidationService: Found ' . $periods->count() . ' fiscal periods');
            
            return $periods;
        } catch (\Exception $e) {
            \Log::error('BudgetValidationService Error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Validate budget availability for purchase order
     */
    public function validateBudgetAvailability($departmentId, $costCenterId, $subCostCenterId, $fiscalPeriodId, $amount)
    {
        $budget = RequestBudget::where('department_id', $departmentId)
            ->where('cost_center_id', $costCenterId)
            ->where('sub_cost_center', $subCostCenterId)
            ->where('fiscal_period_id', $fiscalPeriodId)
            ->where('status', 'Approved')
            ->first();

        if (!$budget) {
            return [
                'valid' => false,
                'message' => 'No approved budget found for the specified criteria',
                'available_amount' => 0
            ];
        }

        if ($budget->balance_amount < $amount) {
            return [
                'valid' => false,
                'message' => 'Insufficient budget. Available amount: ' . number_format($budget->balance_amount, 2),
                'available_amount' => $budget->balance_amount
            ];
        }

        return [
            'valid' => true,
            'budget' => $budget,
            'available_amount' => $budget->balance_amount
        ];
    }

    /**
     * Reserve budget for purchase order
     */
    public function reserveBudget($budget, $amount)
    {
        $budget->reserved_amount += $amount;
        $budget->balance_amount -= $amount;
        $budget->save();

        return $budget;
    }

    /**
     * Release reserved budget (for cancelled/rejected POs)
     */
    public function releaseBudget($budget, $amount)
    {
        $budget->reserved_amount -= $amount;
        $budget->balance_amount += $amount;
        $budget->save();

        return $budget;
    }

    /**
     * Get budget by purchase order
     */
    public function getBudgetByPurchaseOrder($purchaseOrderId)
    {
        $purchaseOrder = PurchaseOrder::with('requestBudget')->find($purchaseOrderId);
        return $purchaseOrder->requestBudget ?? null;
    }
} 