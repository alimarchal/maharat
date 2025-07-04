<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\ExternalInvoice;
use App\Models\FinancialTransaction;
use App\Models\AccountCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Response;
use Carbon\Carbon;
use App\Models\TransactionFlow;

class IncomeStatementController extends Controller
{
    public function getRevenue(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date'
            ]);

            \Log::info('Fetching revenue for period:', [
                'from' => $request->from_date,
                'to' => $request->to_date
            ]);

            $revenue = TransactionFlow::where('account_id', 4)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_revenue' => (float)$revenue ?? 0
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch revenue data: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch revenue data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getExpenses(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date'
            ]);

            $expenses = TransactionFlow::whereIn('account_id', [5,6,7])
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'total_expenses' => (float)$expenses ?? 0
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch expenses data: ' . $e->getMessage(), [
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expenses data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getTransactions(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date'
            ]);

            $total = FinancialTransaction::whereBetween('transaction_date', [
                    $request->from_date,
                    $request->to_date
                ])
                ->whereHas('accountCode', function ($query) {
                    $query->whereIn('account_type', ['Revenue', 'Expense'])
                        ->whereIn('id', [4, 5]);
                })
                ->sum(DB::raw('COALESCE(amount, 0)'));

            return response()->json([
                'success' => true,
                'data' => [
                    'total_amount' => (float)$total ?? 0
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch transaction data: ' . $e->getMessage(), [
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch transaction data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getVatPaid(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date'
            ]);

            $vatPaid = TransactionFlow::whereIn('account_id', [8, 9])
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'vat_paid' => (float)$vatPaid ?? 0
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch VAT paid data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getCurrentNetAssets(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date'
            ]);

            $netAssets = TransactionFlow::whereIn('account_id', [1,10])
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'current_net_assets' => (float)$netAssets ?? 0
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch net assets data',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getOpeningNetAssets(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'from_date' => 'required|date',
            ]);

            // Calculate the day before the selected start date
            $openingDate = date('Y-m-d', strtotime($request->from_date . ' -1 day'));

            $openingNetAssets = TransactionFlow::whereIn('account_id', [1,10])
                ->where('transaction_type', 'debit')
                ->where('transaction_date', '<=', $openingDate)
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'opening_net_assets' => (float)$openingNetAssets ?? 0
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch opening net assets',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getRevenueBreakdown(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date'
        ]);
        $transactions = TransactionFlow::with('account')
            ->where('account_id', 4)
            ->where('transaction_type', 'credit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date')
            ->get()
            ->map(function($t) {
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => $t->account->name ?? '',
                    'amount' => $t->amount,
                    'description' => $t->description,
                ];
            });
        return response()->json(['data' => $transactions]);
    }

    public function getExpensesBreakdown(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date'
        ]);
        $transactions = TransactionFlow::with('account')
            ->whereIn('account_id', [5,6,7])
            ->where('transaction_type', 'credit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date')
            ->get()
            ->map(function($t) {
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => $t->account->name ?? '',
                    'amount' => $t->amount,
                    'description' => $t->description,
                ];
            });
        return response()->json(['data' => $transactions]);
    }

    public function getVatPaidBreakdown(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date'
        ]);
        $transactions = TransactionFlow::with('account')
            ->whereIn('account_id', [8,9])
            ->where('transaction_type', 'credit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date')
            ->get()
            ->map(function($t) {
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => $t->account->name ?? '',
                    'amount' => $t->amount,
                    'description' => $t->description,
                ];
            });
        return response()->json(['data' => $transactions]);
    }

    public function getAssetsBreakdown(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date'
        ]);
        $transactions = TransactionFlow::with('account')
            ->whereIn('account_id', [1,10])
            ->where('transaction_type', 'debit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date')
            ->get()
            ->map(function($t) {
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => $t->account->name ?? '',
                    'amount' => $t->amount,
                    'description' => $t->description,
                ];
            });
        return response()->json(['data' => $transactions]);
    }

    public function getPaidRevenue(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);
        $paidRevenue = TransactionFlow::where('account_id', 11)
            ->where('transaction_type', 'debit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->sum('amount');
        return response()->json(['success' => true, 'data' => ['paid_revenue' => (float)$paidRevenue]], 200);
    }

    public function getTotalRevenue(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);
        $totalRevenue = TransactionFlow::where('account_id', 4)
            ->where('transaction_type', 'credit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->sum('amount');
        return response()->json(['success' => true, 'data' => ['total_revenue' => (float)$totalRevenue]], 200);
    }
}
