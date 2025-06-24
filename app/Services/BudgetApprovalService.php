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
     * @param int $budgetId
     * @param int|null $transactionId
     */
    public function checkApprovalCompletion($budgetId, $transactionId = null)
    {
        $transactions = BudgetApprovalTransaction::where('budget_id', $budgetId)->get();
        
        Log::info('Budget approval completion check - START', [
            'budget_id' => $budgetId,
            'transaction_id' => $transactionId,
            'total_transactions' => $transactions->count(),
            'transactions' => $transactions->map(function($t) {
                return [
                    'id' => $t->id,
                    'order' => $t->order,
                    'status' => $t->status,
                    'created_at' => $t->created_at,
                    'assigned_to' => $t->assigned_to
                ];
            })->toArray()
        ]);
        
        if ($transactions->isEmpty()) {
            Log::info('Budget approval completion check - NO TRANSACTIONS', [
                'budget_id' => $budgetId
            ]);
            return null; // No approval process started
        }

        // Get the transaction just approved, or fallback to latest
        $currentTransaction = $transactionId
            ? $transactions->firstWhere('id', $transactionId)
            : $transactions->sortByDesc('created_at')->first();
        
        if (!$currentTransaction) {
            Log::warning('Budget approval completion check - TRANSACTION NOT FOUND', [
                'budget_id' => $budgetId,
                'transaction_id' => $transactionId
            ]);
            return null;
        }
        
        Log::info('Budget approval completion check - CURRENT TRANSACTION', [
            'budget_id' => $budgetId,
            'current_transaction_id' => $currentTransaction->id,
            'current_transaction_order' => $currentTransaction->order,
            'current_transaction_status' => $currentTransaction->status,
            'current_transaction_created_at' => $currentTransaction->created_at
        ]);
        
        // Check if this transaction is rejected
        if ($currentTransaction->status === 'Reject') {
            Log::info('Budget approval completion check - REJECTED', [
                'budget_id' => $budgetId,
                'transaction_id' => $currentTransaction->id
            ]);
            return 'Reject';
        }
        
        // Check if this transaction is approved
        if ($currentTransaction->status === 'Approve') {
            // Get the process steps to determine if this is the final approval
            $processSteps = \DB::table('process_steps')
                ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                ->whereIn('processes.title', ['Budget Approval', 'Total Budget Approval'])
                ->orderBy('process_steps.order')
                ->get();
            
            Log::info('Budget approval completion check - PROCESS STEPS FOUND', [
                'budget_id' => $budgetId,
                'total_process_steps' => $processSteps->count(),
                'process_titles' => $processSteps->pluck('title')->unique()->toArray(),
                'process_steps' => $processSteps->map(function($step) {
                    return [
                        'id' => $step->id,
                        'process_id' => $step->process_id,
                        'process_title' => $step->title,
                        'order' => $step->order,
                        'description' => $step->description
                    ];
                })->toArray()
            ]);
            
            if ($processSteps->isEmpty()) {
                Log::info('Budget approval completion check - NO PROCESS STEPS, ASSUMING FINAL', [
                    'budget_id' => $budgetId
                ]);
                // If no process steps found, assume single approval is final
                return 'Approve';
            }
            
            // Check if current transaction order equals the highest order in the process
            $maxOrder = $processSteps->max('order');
            $isFinalApproval = $currentTransaction->order >= $maxOrder;
            
            Log::info('Budget approval completion check - FINAL APPROVAL CHECK', [
                'budget_id' => $budgetId,
                'current_transaction_order' => $currentTransaction->order,
                'max_process_order' => $maxOrder,
                'is_final_approval' => $isFinalApproval,
                'current_status' => $currentTransaction->status,
                'process_titles' => $processSteps->pluck('title')->unique()->toArray()
            ]);
            
            if ($isFinalApproval) {
                Log::info('Budget approval completion check - FINAL APPROVAL DETECTED', [
                    'budget_id' => $budgetId,
                    'transaction_id' => $currentTransaction->id
                ]);
                return 'Approve';
            } else {
                Log::info('Budget approval completion check - NOT FINAL APPROVAL YET', [
                    'budget_id' => $budgetId,
                    'transaction_id' => $currentTransaction->id,
                    'current_order' => $currentTransaction->order,
                    'max_order' => $maxOrder
                ]);
                return 'Pending'; // More approvals needed
            }
        }
        
        Log::info('Budget approval completion check - PENDING STATUS', [
            'budget_id' => $budgetId,
            'current_transaction_status' => $currentTransaction->status
        ]);
        
        // If status is Pending or Refer, return Pending
        return 'Pending';
    }
} 