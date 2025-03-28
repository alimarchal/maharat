<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\EquityTransaction\StoreEquityTransactionRequest;
use App\Http\Requests\V1\EquityTransaction\UpdateEquityTransactionRequest;
use App\Http\Resources\V1\EquityTransactionResource;
use App\Http\Resources\V1\EquityTransactionCollection;
use App\Models\EquityAccount;
use App\Models\EquityTransaction;
use App\QueryParameters\EquityTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class EquityTransactionController extends Controller
{
    /**
     * Display a listing of equity transactions.
     */
    public function index(): JsonResponse|EquityTransactionCollection
    {
        $transactions = QueryBuilder::for(EquityTransaction::class)
            ->allowedFilters(EquityTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(EquityTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(EquityTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No equity transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new EquityTransactionCollection($transactions);
    }

    /**
     * Store a newly created equity transaction in storage.
     */
    public function store(StoreEquityTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Generate reference number if not provided
            if (!isset($validated['reference_number'])) {
                $validated['reference_number'] = EquityTransaction::generateReferenceNumber($validated['transaction_type']);
            }

            $transaction = EquityTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Equity transaction created successfully',
                'data' => new EquityTransactionResource($transaction->load([
                    'equityAccount',
                    'creator',
                    'updater'
                ]))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create equity transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified equity transaction.
     */
    public function show(EquityTransaction $equityTransaction): JsonResponse
    {
        return response()->json([
            'data' => new EquityTransactionResource($equityTransaction->load([
                'equityAccount',
                'creator',
                'updater'
            ]))
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified equity transaction in storage.
     */
    public function update(UpdateEquityTransactionRequest $request, EquityTransaction $equityTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $equityTransaction->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Equity transaction updated successfully',
                'data' => new EquityTransactionResource($equityTransaction->load([
                    'equityAccount',
                    'creator',
                    'updater'
                ]))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update equity transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified equity transaction from storage.
     */
    public function destroy(EquityTransaction $equityTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $equityTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Equity transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete equity transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all transactions for a specific equity account.
     */
    public function getAccountTransactions(EquityAccount $equityAccount): JsonResponse|EquityTransactionCollection
    {
        $transactions = QueryBuilder::for(EquityTransaction::class)
            ->where('equity_account_id', $equityAccount->id)
            ->allowedSorts(EquityTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(EquityTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No transactions found for this equity account',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new EquityTransactionCollection($transactions);
    }

    /**
     * Get transactions by type.
     */
    public function getByType(string $type): JsonResponse|EquityTransactionCollection
    {
        $validTypes = [
            'owner_investment',
            'owner_withdrawal',
            'profit_allocation',
            'loss_allocation',
            'dividend_declaration',
            'stock_issuance',
            'stock_buyback',
            'revaluation'
        ];

        if (!in_array($type, $validTypes)) {
            return response()->json([
                'message' => 'Invalid transaction type',
                'error' => 'Type must be one of: ' . implode(', ', $validTypes)
            ], Response::HTTP_BAD_REQUEST);
        }

        $transactions = QueryBuilder::for(EquityTransaction::class)
            ->where('transaction_type', $type)
            ->allowedSorts(EquityTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(EquityTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => "No transactions found with type: {$type}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return new EquityTransactionCollection($transactions);
    }

    /**
     * Get transactions in a date range.
     */
    public function getByDateRange(Request $request): JsonResponse|EquityTransactionCollection
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $transactions = QueryBuilder::for(EquityTransaction::class)
            ->whereBetween('transaction_date', [$validated['start_date'], $validated['end_date']])
            ->allowedSorts(EquityTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(EquityTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => "No transactions found in the specified date range",
                'data' => []
            ], Response::HTTP_OK);
        }

        return new EquityTransactionCollection($transactions);
    }
}
