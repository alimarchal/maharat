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
            if (!$this->checkRequiredTables()) {
                return response()->json(['error' => 'Required tables are missing'], 500);
            }

            if (!$this->checkTableColumns()) {
                return response()->json(['error' => 'Required columns are missing'], 500);
            }

            $years = FiscalPeriod::select(DB::raw('DISTINCT YEAR(fiscal_year) as year'))
                ->orderBy('year', 'desc')
                ->pluck('year')
                ->map(function ($year) {
                    return [
                        'id' => $year,
                        'label' => $year
                    ];
                });

            return response()->json($years);
        } catch (\Exception $e) {
            Log::error('Error fetching fiscal years: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch fiscal years: ' . $e->getMessage()], 500);
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
            if (!$this->checkRequiredTables()) {
                return response()->json(['error' => 'Required tables are missing'], 500);
            }

            if (!$this->checkTableColumns()) {
                return response()->json(['error' => 'Required columns are missing'], 500);
            }

            $year = $request->input('year', date('Y'));
            [$startDate, $endDate] = $this->getYearDateRange($year);

            // Get current assets (cash transactions)
            $currentAssets = CashFlowTransaction::whereBetween('transaction_date', [$startDate, $endDate])
                ->where('transaction_type', 'Credit')
                ->where('payment_method', 'Cash')
                ->join('chart_of_accounts', 'cash_flow_transactions.chart_of_account_id', '=', 'chart_of_accounts.id')
                ->join('account_codes', 'chart_of_accounts.account_code_id', '=', 'account_codes.id')
                ->where('account_codes.account_type', 'Asset')
                ->select(
                    'account_codes.account_code',
                    'chart_of_accounts.description as category',
                    DB::raw('SUM(cash_flow_transactions.amount) as total')
                )
                ->groupBy('account_codes.account_code', 'chart_of_accounts.description')
                ->get();

            // Get non-current assets (non-cash transactions)
            $nonCurrentAssets = CashFlowTransaction::whereBetween('transaction_date', [$startDate, $endDate])
                ->where('transaction_type', 'Credit')
                ->where('payment_method', '!=', 'Cash')
                ->join('chart_of_accounts', 'cash_flow_transactions.chart_of_account_id', '=', 'chart_of_accounts.id')
                ->join('account_codes', 'chart_of_accounts.account_code_id', '=', 'account_codes.id')
                ->where('account_codes.account_type', 'Asset')
                ->select(
                    'account_codes.account_code',
                    'chart_of_accounts.description as category',
                    DB::raw('SUM(cash_flow_transactions.amount) as total')
                )
                ->groupBy('account_codes.account_code', 'chart_of_accounts.description')
                ->get();

            return response()->json([
                'current' => $currentAssets,
                'nonCurrent' => $nonCurrentAssets
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching assets: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch assets data: ' . $e->getMessage()], 500);
        }
    }

    public function getLiabilities(Request $request)
    {
        try {
            if (!$this->checkRequiredTables()) {
                return response()->json(['error' => 'Required tables are missing'], 500);
            }

            if (!$this->checkTableColumns()) {
                return response()->json(['error' => 'Required columns are missing'], 500);
            }

            $year = $request->input('year', date('Y'));
            [$startDate, $endDate] = $this->getYearDateRange($year);

            // Get current liabilities (cash transactions)
            $currentLiabilities = CashFlowTransaction::whereBetween('transaction_date', [$startDate, $endDate])
                ->where('transaction_type', 'Debit')
                ->where('payment_method', 'Cash')
                ->join('chart_of_accounts', 'cash_flow_transactions.chart_of_account_id', '=', 'chart_of_accounts.id')
                ->join('account_codes', 'chart_of_accounts.account_code_id', '=', 'account_codes.id')
                ->where('account_codes.account_type', 'Liability')
                ->select(
                    'account_codes.account_code',
                    'chart_of_accounts.description as category',
                    DB::raw('SUM(cash_flow_transactions.amount) as total')
                )
                ->groupBy('account_codes.account_code', 'chart_of_accounts.description')
                ->get();

            // Get non-current liabilities (non-cash transactions)
            $nonCurrentLiabilities = CashFlowTransaction::whereBetween('transaction_date', [$startDate, $endDate])
                ->where('transaction_type', 'Debit')
                ->where('payment_method', '!=', 'Cash')
                ->join('chart_of_accounts', 'cash_flow_transactions.chart_of_account_id', '=', 'chart_of_accounts.id')
                ->join('account_codes', 'chart_of_accounts.account_code_id', '=', 'account_codes.id')
                ->where('account_codes.account_type', 'Liability')
                ->select(
                    'account_codes.account_code',
                    'chart_of_accounts.description as category',
                    DB::raw('SUM(cash_flow_transactions.amount) as total')
                )
                ->groupBy('account_codes.account_code', 'chart_of_accounts.description')
                ->get();

            return response()->json([
                'current' => $currentLiabilities,
                'nonCurrent' => $nonCurrentLiabilities
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching liabilities: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch liabilities data: ' . $e->getMessage()], 500);
        }
    }

    public function getEquity(Request $request)
    {
        try {
            // Get current assets (without donor restrictions)
            $withoutDonorRestrictions = Asset::where('type', 'current')
                ->where('status', 'active')
                ->select('name', 'current_value as total')
                ->get();

            // Get fixed/tangible assets (with donor restrictions)
            $withDonorRestrictions = Asset::whereIn('type', ['fixed', 'intangible'])
                ->where('status', 'active')
                ->select('name', 'current_value as total')
                ->get();

            return response()->json([
                'withoutDonorRestrictions' => $withoutDonorRestrictions,
                'withDonorRestrictions' => $withDonorRestrictions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching equity: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch equity data'], 500);
        }
    }

    public function getSummary(Request $request)
    {
        try {
            if (!$this->checkRequiredTables()) {
                return response()->json(['error' => 'Required tables are missing'], 500);
            }

            if (!$this->checkTableColumns()) {
                return response()->json(['error' => 'Required columns are missing'], 500);
            }

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
            Log::error('Error fetching summary: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to fetch summary data: ' . $e->getMessage()], 500);
        }
    }
} 