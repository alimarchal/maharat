<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CashFlowTransactionResource;
use App\Models\AccountCode;
use App\Models\CashFlowTransaction;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ExpenseTransactionController extends Controller
{
    /**
     * Get expense transactions for a date range.
     * Filters cash_flow_transactions to only include transactions related to
     * chart_of_accounts with account_code_id corresponding to "Expense" account_type.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $request->validate([
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date',
            ]);

            // Get the expense account codes (account_type is 'Expense')
            $expenseAccountCodeIds = AccountCode::where('account_type', 'Expense')
                ->pluck('id')
                ->toArray();

            // Find chart of accounts with the expense account code IDs
            $expenseChartOfAccountIds = ChartOfAccount::whereIn('account_code_id', $expenseAccountCodeIds)
                ->pluck('id')
                ->toArray();

            // Query for cash flow transactions within the date range and for expense accounts
            $query = CashFlowTransaction::whereIn('chart_of_account_id', $expenseChartOfAccountIds)
                ->with('chartOfAccount');

            // Apply date range filter if provided
            if ($request->has('from_date') && $request->from_date) {
                $query->where('transaction_date', '>=', $request->from_date);
            }

            if ($request->has('to_date') && $request->to_date) {
                $query->where('transaction_date', '<=', $request->to_date);
            }

            // Order by transaction date and ID
            $transactions = $query->orderBy('transaction_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            // Return the response
            return response()->json([
                'data' => $transactions->map(function($transaction) {
                    return [
                        'id' => $transaction->id,
                        'chart_of_account' => [
                            'id' => $transaction->chartOfAccount->id ?? null,
                            'account_name' => $transaction->chartOfAccount->account_name ?? 'Unknown',
                            'description' => $transaction->chartOfAccount->description ?? 'No description'
                        ],
                        'transaction_date' => $transaction->transaction_date,
                        'transaction_type' => $transaction->transaction_type,
                        'amount' => $transaction->amount,
                        'balance_amount' => $transaction->balance_amount,
                        'description' => $transaction->description
                    ];
                }),
                'meta' => [
                    'count' => $transactions->count(),
                    'filters' => [
                        'from_date' => $request->from_date,
                        'to_date' => $request->to_date
                    ]
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve expense transactions',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
} 