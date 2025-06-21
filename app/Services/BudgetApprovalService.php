<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\BudgetApprovalTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BudgetApprovalService
{
    /**
     * Update budget status based on approval result
     */
    public function updateBudgetStatus($budgetId, $status)
    {
        try {
            DB::beginTransaction();

            $budget = Budget::find($budgetId);
            if (!$budget) {
                throw new \Exception('Budget not found');
            }

            $fiscalPeriodId = $budget->fiscal_period_id;

            if ($status === 'Approve') {
                // Update all budgets in the same fiscal period to Active
                Budget::where('fiscal_period_id', $fiscalPeriodId)
                    ->where('status', 'Pending')
                    ->update(['status' => 'Active']);

                Log::info('All budgets in fiscal period updated to Active', [
                    'fiscal_period_id' => $fiscalPeriodId,
                    'budget_id' => $budgetId
                ]);
            } elseif ($status === 'Reject') {
                // Update all budgets in the same fiscal period to Closed
                Budget::where('fiscal_period_id', $fiscalPeriodId)
                    ->where('status', 'Pending')
                    ->update(['status' => 'Closed']);

                Log::info('All budgets in fiscal period updated to Closed', [
                    'fiscal_period_id' => $fiscalPeriodId,
                    'budget_id' => $budgetId
                ]);
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update budget status', [
                'budget_id' => $budgetId,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Check if all approvals are complete for a budget
     */
    public function checkApprovalCompletion($budgetId)
    {
        $transactions = BudgetApprovalTransaction::where('budget_id', $budgetId)->get();
        
        if ($transactions->isEmpty()) {
            return null; // No approval process started
        }

        $allApproved = $transactions->every(function ($transaction) {
            return $transaction->status === 'Approve';
        });

        $anyRejected = $transactions->contains(function ($transaction) {
            return $transaction->status === 'Reject';
        });

        if ($anyRejected) {
            return 'Reject';
        } elseif ($allApproved) {
            return 'Approve';
        } else {
            return 'Pending';
        }
    }
} 