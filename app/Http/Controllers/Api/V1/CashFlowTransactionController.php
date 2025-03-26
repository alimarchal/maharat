<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\CashFlowTransaction\StoreCashFlowTransactionRequest;
use App\Http\Requests\V1\CashFlowTransaction\UpdateCashFlowTransactionRequest;
use App\Http\Resources\V1\CashFlowTransactionResource;
use App\Http\Resources\V1\CashFlowTransactionCollection;
use App\Models\CashFlowTransaction;
use App\Models\Account;
use App\QueryParameters\CashFlowTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Carbon\Carbon;

class CashFlowTransactionController extends Controller
{
    /**
     * Display a listing of the cash flow transactions with filtering, sorting, and pagination.
     *
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Resources\Json\ResourceCollection
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(CashFlowTransaction::class)
            ->allowedFilters([
                AllowedFilter::exact('transaction_type'),
                AllowedFilter::exact('chart_of_account_id'),
                AllowedFilter::exact('sub_cost_center_id'),
                AllowedFilter::exact('account_id'),
                AllowedFilter::exact('payment_method'),
                AllowedFilter::exact('reference_type'),
                AllowedFilter::exact('created_by'),
                AllowedFilter::scope('date_range', 'dateRange'),
                AllowedFilter::callback('reference_number', function ($query, $value) {
                    $query->where('reference_number', 'like', "%{$value}%");
                }),
                AllowedFilter::callback('description', function ($query, $value) {
                    $query->where('description', 'like', "%{$value}%");
                }),
            ])
            ->allowedSorts(CashFlowTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(CashFlowTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No cash flow transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new CashFlowTransactionCollection($transactions);
    }

    /**
     * Store a newly created cash flow transaction with automatic balance calculation.
     *
     * @param \App\Http\Requests\V1\CashFlowTransaction\StoreCashFlowTransactionRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreCashFlowTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Set the authenticated user as creator and updater
            $data['created_by'] = Auth::id();
            $data['updated_by'] = Auth::id();

            // Lock the account to prevent concurrent balance calculations
            $account = Account::where('id', $data['account_id'])->lockForUpdate()->first();

            if (!$account) {
                throw new \Exception('Account not found');
            }

            // Calculate the balance amount based on previous transactions
            $lastTransaction = CashFlowTransaction::where('account_id', $data['account_id'])
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $currentBalance = $lastTransaction ? $lastTransaction->balance_amount : 0;

            // Update balance based on transaction type
            if ($data['transaction_type'] === 'Credit') {
                $data['balance_amount'] = $currentBalance + $data['amount'];
            } else {
                $data['balance_amount'] = $currentBalance - $data['amount'];
            }

            $transaction = CashFlowTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Cash flow transaction created successfully',
                'data' => new CashFlowTransactionResource(
                    $transaction->load([
                        'chartOfAccount',
                        'subCostCenter',
                        'account',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create cash flow transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified cash flow transaction.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $transaction = QueryBuilder::for(CashFlowTransaction::class)
                ->allowedIncludes(CashFlowTransactionParameters::ALLOWED_INCLUDES)
                ->findOrFail($id);

            return response()->json([
                'data' => new CashFlowTransactionResource($transaction)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve cash flow transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Update the specified cash flow transaction and recalculate balances.
     *
     * @param \App\Http\Requests\V1\CashFlowTransaction\UpdateCashFlowTransactionRequest $request
     * @param \App\Models\CashFlowTransaction $cashFlowTransaction
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateCashFlowTransactionRequest $request, CashFlowTransaction $cashFlowTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Store original values for comparison
            $originalAccountId = $cashFlowTransaction->account_id;
            $originalAmount = $cashFlowTransaction->amount;
            $originalType = $cashFlowTransaction->transaction_type;
            $originalDate = $cashFlowTransaction->transaction_date;

            // Update the transaction with validated data
            $data = $request->validated();
            $data['updated_by'] = Auth::id();

            // Lock the transaction to prevent concurrent updates
            $lockedTransaction = CashFlowTransaction::where('id', $cashFlowTransaction->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedTransaction) {
                throw new \Exception('Transaction not found or locked by another process');
            }

            $cashFlowTransaction->update($data);

            // Determine if we need to recalculate balances
            $recalculateNeeded =
                $originalAccountId != $cashFlowTransaction->account_id ||
                $originalAmount != $cashFlowTransaction->amount ||
                $originalType != $cashFlowTransaction->transaction_type ||
                $originalDate != $cashFlowTransaction->transaction_date;

            if ($recalculateNeeded) {
                // If account changed, recalculate both old and new accounts
                if ($originalAccountId != $cashFlowTransaction->account_id) {
                    $this->recalculateAccountBalances($originalAccountId, $originalDate);
                    $this->recalculateAccountBalances($cashFlowTransaction->account_id, $cashFlowTransaction->transaction_date);
                } else {
                    // Use the earlier date between original and new as starting point
                    $recalculationDate = min($originalDate, $cashFlowTransaction->transaction_date);
                    $this->recalculateAccountBalances($cashFlowTransaction->account_id, $recalculationDate);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Cash flow transaction updated successfully',
                'data' => new CashFlowTransactionResource(
                    $cashFlowTransaction->fresh(['chartOfAccount', 'subCostCenter', 'account', 'creator', 'updater'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update cash flow transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified cash flow transaction and recalculate balances.
     *
     * @param \App\Models\CashFlowTransaction $cashFlowTransaction
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(CashFlowTransaction $cashFlowTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Record the transaction's account ID and date before deletion
            $accountId = $cashFlowTransaction->account_id;
            $transactionDate = $cashFlowTransaction->transaction_date;

            // Lock the transaction to prevent concurrent deletion
            $lockedTransaction = CashFlowTransaction::where('id', $cashFlowTransaction->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedTransaction) {
                throw new \Exception('Transaction not found or locked by another process');
            }

            $cashFlowTransaction->delete();

            // Recalculate balances for all transactions after the deleted one
            $this->recalculateAccountBalances($accountId, $transactionDate);

            DB::commit();

            return response()->json([
                'message' => 'Cash flow transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete cash flow transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Recalculate balances for an account from a specific date.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function recalculateBalances(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'account_id' => 'required|exists:accounts,id',
                'from_date' => 'required|date'
            ]);

            DB::beginTransaction();

            $this->recalculateAccountBalances(
                $request->input('account_id'),
                $request->input('from_date')
            );

            DB::commit();

            return response()->json([
                'message' => 'Account balances recalculated successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to recalculate account balances',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get the current balance for an account as of a specific date.
     *
     * @param string $accountId
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAccountBalance(string $accountId, Request $request): JsonResponse
    {
        try {
            $request->validate([
                'as_of_date' => 'nullable|date'
            ]);

            $asOfDate = $request->input('as_of_date', now()->toDateString());

            $latestTransaction = CashFlowTransaction::where('account_id', $accountId)
                ->where('transaction_date', '<=', $asOfDate)
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $balance = $latestTransaction ? $latestTransaction->balance_amount : 0;

            return response()->json([
                'data' => [
                    'account_id' => $accountId,
                    'as_of_date' => $asOfDate,
                    'balance' => $balance
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve account balance',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get a statement of transactions for an account within a date range.
     *
     * @param string $accountId
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAccountStatement(string $accountId, Request $request): JsonResponse
    {
        try {
            $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date'
            ]);

            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Get the opening balance (balance as of the day before start date)
            $openingBalanceTransaction = CashFlowTransaction::where('account_id', $accountId)
                ->where('transaction_date', '<', $startDate)
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $openingBalance = $openingBalanceTransaction ? $openingBalanceTransaction->balance_amount : 0;

            // Get all transactions in the date range
            $transactions = CashFlowTransaction::where('account_id', $accountId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->orderBy('transaction_date')
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();

            // Calculate the closing balance
            $closingBalance = $transactions->isEmpty()
                ? $openingBalance
                : $transactions->last()->balance_amount;

            // Prepare statement data
            $statement = [
                'account_id' => $accountId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'opening_balance' => $openingBalance,
                'closing_balance' => $closingBalance,
                'transactions' => CashFlowTransactionResource::collection($transactions)
            ];

            return response()->json([
                'data' => $statement
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve account statement',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Recalculate balances for all transactions in an account after a specific date.
     *
     * @param string $accountId
     * @param string $fromDate
     * @return void
     */
    private function recalculateAccountBalances(string $accountId, string $fromDate): void
    {
        // Get the last transaction before the specified date to establish starting balance
        $lastTransaction = CashFlowTransaction::where('account_id', $accountId)
            ->where('transaction_date', '<', $fromDate)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $currentBalance = $lastTransaction ? $lastTransaction->balance_amount : 0;

        // Get all transactions from the specified date onwards, ordered by date
        $transactions = CashFlowTransaction::where('account_id', $accountId)
            ->where('transaction_date', '>=', $fromDate)
            ->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($transactions as $transaction) {
            // Update the balance based on transaction type
            if ($transaction->transaction_type === 'Credit') {
                $currentBalance += $transaction->amount;
            } else {
                $currentBalance -= $transaction->amount;
            }

            // Update the transaction with the new balance
            $transaction->balance_amount = $currentBalance;
            $transaction->save();
        }
    }
}
