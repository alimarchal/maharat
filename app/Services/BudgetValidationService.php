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
     * Validate budget availability for purchase order or invoice
     * @param int|null $departmentId
     * @param int|null $costCenterId
     * @param int|null $subCostCenterId
     * @param int $fiscalPeriodId
     * @param float $amount
     * @param string $type 'purchase_order' or 'invoice'
     */
    public function validateBudgetAvailability($departmentId, $costCenterId, $subCostCenterId, $fiscalPeriodId, $amount, $type = 'purchase_order')
    {
        \Log::info('BudgetValidationService: Starting validation', [
            'departmentId' => $departmentId,
            'costCenterId' => $costCenterId,
            'subCostCenterId' => $subCostCenterId,
            'fiscalPeriodId' => $fiscalPeriodId,
            'amount' => $amount,
            'type' => $type
        ]);

        if ($type === 'invoice') {
            // For invoices, we need to check if there's a budget available for revenue tracking
            // This is different from purchase orders - we're checking if there's a budget to track revenue
            // Use the same logic as BudgetRevenueUpdateService - find any active budget in the fiscal period
            $budget = \App\Models\Budget::where('status', 'Active')
                ->whereHas('fiscalPeriod', function($query) use ($fiscalPeriodId) {
                    $query->where('id', $fiscalPeriodId);
                })
                ->first();

            if (!$budget) {
                \Log::warning('BudgetValidationService: No active budget found for invoice', [
                    'fiscalPeriodId' => $fiscalPeriodId
                ]);
                return [
                    'valid' => false,
                    'message' => 'No active budget found for the specified fiscal period. Cannot create invoice without proper budget allocation.',
                    'available_amount' => 0
                ];
            }

            // For invoices, we don't need to check balance since we're tracking revenue, not spending
            \Log::info('BudgetValidationService: Invoice validation successful', [
                'budgetId' => $budget->id
            ]);
            return [
                'valid' => true,
                'budget' => $budget,
                'available_amount' => 0 // Not applicable for revenue tracking
            ];
        } else {
            // For purchase orders, we need to check if there's a request budget available
            // that has been approved and has sufficient balance
            $requestBudgetQuery = \App\Models\RequestBudget::where('fiscal_period_id', $fiscalPeriodId);
            
            \Log::info('BudgetValidationService: Building request budget query', [
                'fiscalPeriodId' => $fiscalPeriodId
            ]);
            
            // Add department filter if provided
            if ($departmentId !== null) {
                $requestBudgetQuery->where('department_id', $departmentId);
                \Log::info('BudgetValidationService: Added department filter', ['departmentId' => $departmentId]);
            }
            
            // Add cost center filter if provided
            if ($costCenterId !== null) {
                $requestBudgetQuery->where('cost_center_id', $costCenterId);
                \Log::info('BudgetValidationService: Added cost center filter', ['costCenterId' => $costCenterId]);
            }
            
            // Handle sub_cost_center - if null, use whereNull, otherwise use where
            if ($subCostCenterId === null) {
                $requestBudgetQuery->whereNull('sub_cost_center');
                \Log::info('BudgetValidationService: Added sub_cost_center NULL filter');
            } else {
                $requestBudgetQuery->where('sub_cost_center', $subCostCenterId);
                \Log::info('BudgetValidationService: Added sub_cost_center filter', ['subCostCenterId' => $subCostCenterId]);
            }
            
            $requestBudget = $requestBudgetQuery->where('status', 'Approved')->first();

            \Log::info('BudgetValidationService: Request budget query result', [
                'found' => $requestBudget ? true : false,
                'budgetId' => $requestBudget ? $requestBudget->id : null,
                'status' => $requestBudget ? $requestBudget->status : null
            ]);

            if (!$requestBudget) {
                \Log::warning('BudgetValidationService: No approved budget request found', [
                    'departmentId' => $departmentId,
                    'costCenterId' => $costCenterId,
                    'subCostCenterId' => $subCostCenterId,
                    'fiscalPeriodId' => $fiscalPeriodId
                ]);
                return [
                    'valid' => false,
                    'message' => 'No approved budget request found for the specified criteria',
                    'available_amount' => 0
                ];
            }

            // Check if there's sufficient balance
            $availableAmount = $requestBudget->balance_amount ?? 0;
            
            \Log::info('BudgetValidationService: Checking balance', [
                'availableAmount' => $availableAmount,
                'requiredAmount' => $amount,
                'sufficient' => $availableAmount >= $amount
            ]);
            
            if ($availableAmount < $amount) {
                \Log::warning('BudgetValidationService: Insufficient balance', [
                    'availableAmount' => $availableAmount,
                    'requiredAmount' => $amount
                ]);
                return [
                    'valid' => false,
                    'message' => "Insufficient budget balance. Available: {$availableAmount}, Required: {$amount}",
                    'available_amount' => $availableAmount
                ];
            }

            \Log::info('BudgetValidationService: Purchase order validation successful', [
                'budgetId' => $requestBudget->id,
                'availableAmount' => $availableAmount
            ]);

            return [
                'valid' => true,
                'budget' => $requestBudget,
                'available_amount' => $availableAmount
            ];
        }
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