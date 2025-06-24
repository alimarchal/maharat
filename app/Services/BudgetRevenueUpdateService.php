<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\FiscalPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BudgetRevenueUpdateService
{
    /**
     * Update budget revenue when invoice is approved
     */
    public function updateBudgetRevenue($invoice)
    {
        try {
            DB::beginTransaction();

            $invoiceDate = $invoice->issue_date;
            $invoiceAmount = $invoice->total_amount;

            Log::info('Starting budget revenue update', [
                'invoice_id' => $invoice->id,
                'invoice_date' => $invoiceDate,
                'invoice_amount' => $invoiceAmount
            ]);

            // Find main budgets for the invoice date
            $mainBudgets = $this->findMainBudgets($invoiceDate);

            Log::info('Found main budgets', [
                'invoice_id' => $invoice->id,
                'budgets_count' => $mainBudgets->count(),
                'budgets' => $mainBudgets->map(function($budget) {
                    return [
                        'id' => $budget->id,
                        'fiscal_period' => $budget->fiscalPeriod->period_name ?? 'N/A',
                        'current_revenue' => $budget->total_revenue_actual ?? 0
                    ];
                })
            ]);

            if ($mainBudgets->isEmpty()) {
                DB::rollBack();
                $formattedDate = Carbon::parse($invoiceDate)->format('d/m/Y');
                $errorMessage = "No main budget found for the fiscal year of invoice date: " . $formattedDate;
                Log::warning($errorMessage, ['invoice_id' => $invoice->id]);
                return [
                    'success' => false,
                    'message' => $errorMessage
                ];
            }

            // Update all matching budgets
            foreach ($mainBudgets as $budget) {
                $oldRevenue = $budget->total_revenue_actual ?? 0;
                $budget->total_revenue_actual = $oldRevenue + $invoiceAmount;
                $budget->save();

                Log::info('Updated budget revenue', [
                    'invoice_id' => $invoice->id,
                    'budget_id' => $budget->id,
                    'old_revenue' => $oldRevenue,
                    'new_revenue' => $budget->total_revenue_actual,
                    'amount_added' => $invoiceAmount
                ]);
            }

            DB::commit();

            $successMessage = "Budget revenue updated successfully for " . $mainBudgets->count() . " budget(s)";
            Log::info($successMessage, ['invoice_id' => $invoice->id]);

            return [
                'success' => true,
                'message' => $successMessage,
                'budgets_updated' => $mainBudgets->count()
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Budget revenue update failed: ' . $e->getMessage(), [
                'invoice_id' => $invoice->id,
                'invoice_date' => $invoiceDate ?? null,
                'amount' => $invoiceAmount ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => "Failed to update budget revenue: " . $e->getMessage()
            ];
        }
    }

    /**
     * Find main budgets for a given date
     */
    private function findMainBudgets($date)
    {
        // Find all budgets with status Active whose fiscal period covers the date
        return Budget::where('status', 'Active')
            ->whereHas('fiscalPeriod', function($query) use ($date) {
                $query->where('start_date', '<=', $date)
                      ->where('end_date', '>=', $date);
            })
            ->with('fiscalPeriod')
            ->get();
    }

    /**
     * Check if main budget exists for an invoice (without updating)
     */
    public function checkMainBudgetExists($invoice)
    {
        try {
            $invoiceDate = $invoice->issue_date;

            Log::info('Checking if main budget exists', [
                'invoice_id' => $invoice->id,
                'invoice_date' => $invoiceDate
            ]);

            // Find main budgets for the invoice date
            $mainBudgets = $this->findMainBudgets($invoiceDate);

            Log::info('Main budget check result', [
                'invoice_id' => $invoice->id,
                'budgets_found' => $mainBudgets->count(),
                'budgets' => $mainBudgets->map(function($budget) {
                    return [
                        'id' => $budget->id,
                        'fiscal_period' => $budget->fiscalPeriod->period_name ?? 'N/A',
                        'current_revenue' => $budget->total_revenue_actual ?? 0
                    ];
                })
            ]);

            if ($mainBudgets->isEmpty()) {
                $formattedDate = Carbon::parse($invoiceDate)->format('d/m/Y');
                $errorMessage = "No main budget found for the fiscal year of invoice date: " . $formattedDate;
                Log::warning($errorMessage, ['invoice_id' => $invoice->id]);
                return [
                    'exists' => false,
                    'message' => $errorMessage
                ];
            }

            return [
                'exists' => true,
                'message' => "Main budget found for fiscal year. " . $mainBudgets->count() . " budget(s) will be updated.",
                'budgets_count' => $mainBudgets->count()
            ];

        } catch (\Exception $e) {
            Log::error('Budget existence check failed: ' . $e->getMessage(), [
                'invoice_id' => $invoice->id,
                'invoice_date' => $invoiceDate ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'exists' => false,
                'message' => "Failed to check budget existence: " . $e->getMessage()
            ];
        }
    }
} 