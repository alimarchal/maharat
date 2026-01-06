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

            // Expense accounts: expenses increase with debits, decrease with credits
            // So we sum debits (expense increases) minus credits (expense decreases)
            // Include Account 8 (VAT Paid) in expenses: debits - credits (this cancels out VAT refunds)
            $debits = TransactionFlow::whereIn('account_id', [5,6,7,8])
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');
            $credits = TransactionFlow::whereIn('account_id', [5,6,7,8])
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');
            $expenses = $debits - $credits;

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

            // Account 8 (VAT Paid): Calculate as debits minus credits (VAT paid minus VAT refunded)
            // This cancels out and shows net VAT expense impact
            $vatPaidDebits = TransactionFlow::where('account_id', 8)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');
            
            $vatPaidCredits = TransactionFlow::where('account_id', 8)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');
            
            $vatPaid = (float)($vatPaidDebits - $vatPaidCredits);

            // Account 9 (VAT Collected on Maharat invoices) - for sales
            $vatCollected = TransactionFlow::where('account_id', 9)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
                ->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'vat_paid' => $vatPaid,
                    'vat_collected' => (float)$vatCollected ?? 0,
                    'vat_paid_debits' => (float)$vatPaidDebits ?? 0,
                    'vat_paid_credits' => (float)$vatPaidCredits ?? 0,
                    'note' => 'VAT Paid (Account 8) is calculated as debits minus credits (VAT paid minus VAT refunded).'
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
        // Get both debits and credits for expense accounts (including Account 8 - VAT Paid)
        // For Accounts 5,6,7: debits are positive (expense increases), credits are negative (expense decreases)
        // For Account 8: debits are negative (VAT paid), credits are positive (VAT refunded) with different label
        $debitTransactions = TransactionFlow::with('account')
            ->whereIn('account_id', [5,6,7,8])
            ->where('transaction_type', 'debit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->get()
            ->map(function($t) {
                $accountName = $t->account->name ?? 'Unknown';
                // For Account 8, use "VAT Paid (on purchases)" label
                if ($t->account_id == 8) {
                    $accountName = 'VAT Paid (on purchases)';
                    return [
                        'reference_number' => $t->reference_number,
                        'account_name' => $accountName,
                        'amount' => -(float)$t->amount, // Negative for Account 8 debits (VAT paid)
                        'description' => $t->description,
                        'type' => 'debit'
                    ];
                }
                // For Accounts 5,6,7, debits are positive
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => $accountName,
                    'amount' => (float)$t->amount,
                    'description' => $t->description,
                    'type' => 'debit'
                ];
            });
        
        $creditTransactions = TransactionFlow::with('account')
            ->whereIn('account_id', [5,6,7,8])
            ->where('transaction_type', 'credit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->get()
            ->map(function($t) {
                $accountName = $t->account->name ?? 'Unknown';
                // For Account 8, use "VAT Refunded (on purchases)" label and positive amount
                if ($t->account_id == 8) {
                    $accountName = 'VAT Refunded (on purchases)';
                    return [
                        'reference_number' => $t->reference_number,
                        'account_name' => $accountName,
                        'amount' => (float)$t->amount, // Positive for Account 8 credits (VAT refunded)
                        'description' => $t->description,
                        'type' => 'credit'
                    ];
                }
                // For Accounts 5,6,7, credits are negative (expense decreases)
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => $accountName,
                    'amount' => -(float)$t->amount, // Negative for credits (expense decreases)
                    'description' => $t->description,
                    'type' => 'credit'
                ];
            });
        $transactions = $debitTransactions->concat($creditTransactions)->sortBy('transaction_date')->values();
        return response()->json(['data' => $transactions]);
    }

    public function getVatPaidBreakdown(Request $request): JsonResponse
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date'
        ]);
        // Account 8 (VAT Paid): Include both debits (VAT paid) and credits (VAT refunded)
        // Debits are negative (VAT paid), credits are positive (VAT refunded)
        $debitTransactions = TransactionFlow::with('account')
            ->where('account_id', 8)
            ->where('transaction_type', 'debit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date')
            ->get()
            ->map(function($t) {
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => 'VAT Paid (on purchases)',
                    'amount' => -(float)$t->amount, // Negative for debits (VAT paid)
                    'description' => $t->description,
                    'type' => 'debit'
                ];
            });
        
        $creditTransactions = TransactionFlow::with('account')
            ->where('account_id', 8)
            ->where('transaction_type', 'credit')
            ->whereBetween('transaction_date', [$request->from_date, $request->to_date])
            ->orderBy('transaction_date')
            ->get()
            ->map(function($t) {
                return [
                    'reference_number' => $t->reference_number,
                    'account_name' => 'VAT Refunded (on purchases)',
                    'amount' => (float)$t->amount, // Positive for credits (VAT refunded)
                    'description' => $t->description,
                    'type' => 'credit'
                ];
            });
        
        // Combine debits and credits, sorted by date
        $transactions = $debitTransactions->concat($creditTransactions)
            ->sortBy('transaction_date')
            ->values();
        
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
