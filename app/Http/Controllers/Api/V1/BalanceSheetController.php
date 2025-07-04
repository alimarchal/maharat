<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CashFlowTransaction;
use App\Models\ChartOfAccount;
use App\Models\AccountCode;
use App\Models\FiscalPeriod;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\TransactionFlow;

class BalanceSheetController extends Controller
{
    private function checkRequiredTables()
    {
        $requiredTables = [
            'cash_flow_transactions',
            'chart_of_accounts',
            'account_codes',
            'fiscal_periods',
            'assets'
        ];

        foreach ($requiredTables as $table) {
            if (!Schema::hasTable($table)) {
                Log::error("Required table {$table} does not exist");
                return false;
            }
        }

        return true;
    }

    private function checkTableColumns()
    {
        $requiredColumns = [
            'cash_flow_transactions' => [
                'transaction_date',
                'transaction_type',
                'payment_method',
                'chart_of_account_id',
                'amount'
            ],
            'chart_of_accounts' => [
                'id',
                'account_code_id',
                'description'
            ],
            'account_codes' => [
                'id',
                'account_code',
                'account_type'
            ],
            'fiscal_periods' => [
                'fiscal_year'
            ],
            'assets' => [
                'id',
                'name',
                'type',
                'status',
                'current_value',
                'acquisition_date'
            ]
        ];

        foreach ($requiredColumns as $table => $columns) {
            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) {
                    Log::error("Column {$column} does not exist in table {$table}");
                    return false;
                }
            }
        }

        return true;
    }

    public function getFiscalYears()
    {
        try {
            $years = \App\Models\FiscalYear::orderBy('fiscal_year', 'desc')
                ->get()
                ->map(function ($fy) {
                    return [
                        'id' => $fy->id,
                        'label' => $fy->fiscal_year
                    ];
                });

            return response()->json($years);
        } catch (\Exception $e) {
            \Log::error('Error fetching fiscal years: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch fiscal years'], 500);
        }
    }

    private function getYearDateRange($year)
    {
        $startDate = Carbon::createFromDate($year, 1, 1)->startOfDay();
        $endDate = Carbon::createFromDate($year, 12, 31)->endOfDay();
        return [$startDate, $endDate];
    }

    public function getAssets(Request $request)
    {
        try {
            $year = $request->input('year', date('Y'));
            $fromDate = Carbon::createFromDate($year, 1, 1)->toDateString();
            $toDate = Carbon::createFromDate($year, 12, 31)->toDateString();

            // Current Assets: Assets (1), Account Receivable (11), Cash (12)
            $currentAssets = [];
            // Assets (id 1): sum of debits - sum of credits
            $debits = TransactionFlow::where('account_id', 1)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $credits = TransactionFlow::where('account_id', 1)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $balance = $debits - $credits;
            $account = \App\Models\Account::find(1);
            $label = $account ? $account->name : 'Account 1';
            $currentAssets[] = [
                'account_id' => 1,
                'category' => $label,
                'total' => $balance
            ];
            // Account Receivable (id 11): sum of debits for 11 - sum of credits for 4
            $debits = TransactionFlow::where('account_id', 11)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $credits = TransactionFlow::where('account_id', 4)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $balance = $debits - $credits;
            $account = \App\Models\Account::find(11);
            $label = $account ? $account->name : 'Account 11';
            $currentAssets[] = [
                'account_id' => 11,
                'category' => $label,
                'total' => $balance
            ];
            // Cash (id 12): sum of debits - sum of credits
            $debits = TransactionFlow::where('account_id', 12)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $credits = TransactionFlow::where('account_id', 12)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $balance = $debits - $credits;
            $account = \App\Models\Account::find(12);
            $label = $account ? $account->name : 'Account 12';
            $currentAssets[] = [
                'account_id' => 12,
                'category' => $label,
                'total' => $balance
            ];

            // Non-Current Assets: Special Accounts (10)
            $nonCurrentAssets = [];
            $accountId = 10;
            $debits = TransactionFlow::where('account_id', $accountId)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $credits = TransactionFlow::where('account_id', $accountId)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $balance = $debits - $credits;
            $account = \App\Models\Account::find($accountId);
            $label = $account ? $account->name : 'Account ' . $accountId;
            $nonCurrentAssets[] = [
                'account_id' => $accountId,
                'category' => $label,
                'total' => $balance
            ];

            return response()->json([
                'current' => $currentAssets,
                'nonCurrent' => $nonCurrentAssets
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching assets: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch assets data: ' . $e->getMessage()], 500);
        }
    }

    public function getLiabilities(Request $request)
    {
        try {
            $year = $request->input('year', date('Y'));
            $fromDate = Carbon::createFromDate($year, 1, 1)->toDateString();
            $toDate = Carbon::createFromDate($year, 12, 31)->toDateString();

            // Current Liabilities: Accounts Payable (2)
            $currentLiabilities = [];
            $accountId = 2;
            $credits = TransactionFlow::where('account_id', $accountId)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $debits = TransactionFlow::where('account_id', $accountId)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount');
            $balance = $credits - $debits;
            $account = \App\Models\Account::find($accountId);
            $label = $account ? $account->name : 'Account ' . $accountId;
            $currentLiabilities[] = [
                'account_id' => $accountId,
                'category' => $label,
                'total' => $balance
            ];

            // Non-Current Liabilities: None (show 0)
            $nonCurrentLiabilities = [
                [
                    'account_id' => null,
                    'category' => 'None',
                    'total' => 0
                ]
            ];

            return response()->json([
                'current' => $currentLiabilities,
                'nonCurrent' => $nonCurrentLiabilities
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching liabilities: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch liabilities data: ' . $e->getMessage()], 500);
        }
    }

    public function getEquity(Request $request)
    {
        try {
            $year = $request->input('year', date('Y'));
            $fromDate = Carbon::createFromDate($year, 1, 1)->toDateString();
            $toDate = Carbon::createFromDate($year, 12, 31)->toDateString();

            // Paid Revenue: sum of debit for Account Receivable (11)
            $paidRevenue = (float) (TransactionFlow::where('account_id', 11)
                ->where('transaction_type', 'debit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount') ?? 0);

            // Expenses: sum of credit for [5,6,7]
            $expenses = (float) (TransactionFlow::whereIn('account_id', [5,6,7])
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount') ?? 0);

            // Regular Funds: paid revenue - expenses
            $regularFunds = $paidRevenue - $expenses;

            // Total Revenue: sum of credit for Revenue/Income (4)
            $totalRevenue = (float) (TransactionFlow::where('account_id', 4)
                ->where('transaction_type', 'credit')
                ->whereBetween('transaction_date', [$fromDate, $toDate])
                ->sum('amount') ?? 0);

            // Restricted Funds: total revenue - paid revenue
            $restrictedFunds = $totalRevenue - $paidRevenue;

            $withoutDonorRestrictions = [
                [
                    'name' => 'Regular Funds',
                    'change' => (float) $regularFunds,
                    'beginning' => 0.0,
                    'end' => (float) $regularFunds
                ]
            ];
            $withDonorRestrictions = [
                [
                    'name' => 'Restricted Funds',
                    'change' => (float) $restrictedFunds,
                    'beginning' => 0.0,
                    'end' => (float) $restrictedFunds
                ]
            ];

            return response()->json([
                'withoutDonorRestrictions' => $withoutDonorRestrictions,
                'withDonorRestrictions' => $withDonorRestrictions,
                'totalEnd' => (float) ($regularFunds + $restrictedFunds)
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching equity: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch equity data'], 500);
        }
    }

    public function getSummary(Request $request)
    {
        try {
            $year = $request->input('year', date('Y'));
            [$startDate, $endDate] = $this->getYearDateRange($year);

            $assets = $this->getAssets($request)->getData();
            $liabilities = $this->getLiabilities($request)->getData();
            $equity = $this->getEquity($request)->getData();

            $totalAssets = collect($assets->current)->sum('total') + collect($assets->nonCurrent)->sum('total');
            $totalLiabilities = collect($liabilities->current)->sum('total') + collect($liabilities->nonCurrent)->sum('total');
            $totalEquity = collect($equity->withoutDonorRestrictions)->sum('total') + collect($equity->withDonorRestrictions)->sum('total');

            return response()->json([
                'totalAssets' => $totalAssets,
                'totalLiabilities' => $totalLiabilities,
                'totalEquity' => $totalEquity,
                'balance' => $totalAssets - ($totalLiabilities + $totalEquity)
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching summary: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch summary data: ' . $e->getMessage()], 500);
        }
    }
} 