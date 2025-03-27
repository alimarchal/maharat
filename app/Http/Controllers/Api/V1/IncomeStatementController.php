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

            $revenue = Invoice::whereBetween('issue_date', [
                    $request->from_date,
                    $request->to_date
                ])
                ->where('status', '!=', 'Cancelled')
                ->sum(DB::raw('COALESCE(subtotal, 0)'));

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

            $expenses = Invoice::whereBetween('issue_date', [
                    $request->from_date,
                    $request->to_date
                ])
                ->where('status', '!=', 'Cancelled')
                ->sum(DB::raw('COALESCE(total_amount, 0)'));

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
}
