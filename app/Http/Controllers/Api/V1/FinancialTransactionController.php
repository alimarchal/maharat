<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\FinancialTransaction\StoreFinancialTransactionRequest;
use App\Http\Requests\V1\FinancialTransaction\UpdateFinancialTransactionRequest;
use App\Http\Resources\V1\FinancialTransactionResource;
use App\Http\Resources\V1\FinancialTransactionCollection;
use App\Models\FinancialTransaction;
use App\QueryParameters\FinancialTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;


class FinancialTransactionController extends Controller
{
    /**
     * Display a listing of financial transactions.
     */
    public function index(): JsonResponse|FinancialTransactionCollection
    {
        // Create the custom filters array
        $customFilters = [];
        foreach (FinancialTransactionParameters::CUSTOM_FILTERS as $filterName => $filterClass) {
            $customFilters[] = AllowedFilter::custom($filterName, new $filterClass);
        }

        // Create exact filters array
        $exactFilters = [];
        foreach (FinancialTransactionParameters::ALLOWED_FILTERS_EXACT as $filter) {
            $exactFilters[] = AllowedFilter::exact($filter);
        }

        // Combine all filters into a single array
        $allFilters = array_merge(
            FinancialTransactionParameters::ALLOWED_FILTERS,
            $exactFilters,
            $customFilters
        );

        $transactions = QueryBuilder::for(FinancialTransaction::class)
            ->allowedFilters($allFilters)
            ->allowedSorts(FinancialTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(FinancialTransactionParameters::ALLOWED_INCLUDES)
            ->paginate(10000)
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No financial transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new FinancialTransactionCollection($transactions);
    }

    /**
     * Store a newly created financial transaction.
     */
    public function store(StoreFinancialTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator
            $validated['created_by'] = Auth::id();
            $validated['updated_by'] = Auth::id();

            $transaction = FinancialTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction created successfully',
                'data' => new FinancialTransactionResource(
                    $transaction->load([
                        'accountCode',
                        'chartOfAccount',
                        'account',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'fiscalPeriod',
                        'creator',
                        'updater',
                        'approver'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified financial transaction.
     */
    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(FinancialTransaction::class)
            ->allowedIncludes(FinancialTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new FinancialTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified financial transaction.
     */
    public function update(UpdateFinancialTransactionRequest $request, FinancialTransaction $financialTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $financialTransaction->update($validated);

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction updated successfully',
                'data' => new FinancialTransactionResource(
                    $financialTransaction->load([
                        'accountCode',
                        'chartOfAccount',
                        'account',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'fiscalPeriod',
                        'creator',
                        'updater',
                        'approver'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified financial transaction.
     */
    public function destroy(FinancialTransaction $financialTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $financialTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted financial transaction.
     */
    public function restore(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $transaction = FinancialTransaction::withTrashed()->findOrFail($id);
            $transaction->restore();

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction restored successfully',
                'data' => new FinancialTransactionResource($transaction)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Approve a financial transaction.
     */
    public function approve(FinancialTransaction $financialTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $financialTransaction->update([
                'status' => 'Approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction approved successfully',
                'data' => new FinancialTransactionResource(
                    $financialTransaction->load([
                        'accountCode',
                        'chartOfAccount',
                        'account',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'fiscalPeriod',
                        'creator',
                        'updater',
                        'approver'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Post a financial transaction.
     */
    public function post(FinancialTransaction $financialTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Only approved transactions can be posted
            if ($financialTransaction->status !== 'Approved') {
                return response()->json([
                    'message' => 'Only approved transactions can be posted',
                    'error' => 'Transaction must be approved first'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $financialTransaction->update([
                'status' => 'Posted',
                'posted_at' => now(),
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction posted successfully',
                'data' => new FinancialTransactionResource(
                    $financialTransaction->load([
                        'accountCode',
                        'chartOfAccount',
                        'account',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'fiscalPeriod',
                        'creator',
                        'updater',
                        'approver'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to post financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Cancel a financial transaction.
     */
    public function cancel(FinancialTransaction $financialTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Posted transactions cannot be canceled
            if ($financialTransaction->status === 'Posted') {
                return response()->json([
                    'message' => 'Posted transactions cannot be canceled',
                    'error' => 'Transaction must be reversed instead'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $financialTransaction->update([
                'status' => 'Canceled',
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction canceled successfully',
                'data' => new FinancialTransactionResource(
                    $financialTransaction->load([
                        'accountCode',
                        'chartOfAccount',
                        'account',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'fiscalPeriod',
                        'creator',
                        'updater',
                        'approver'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to cancel financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Reverse a posted financial transaction.
     */
    public function reverse(FinancialTransaction $financialTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Only posted transactions can be reversed
            if ($financialTransaction->status !== 'Posted') {
                return response()->json([
                    'message' => 'Only posted transactions can be reversed',
                    'error' => 'Transaction must be posted first'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Create a reversal transaction
            $reversal = $financialTransaction->replicate();
            $reversal->entry_type = 'Reversal';
            $reversal->status = 'Draft';
            $reversal->amount = -$financialTransaction->amount;
            $reversal->description = 'Reversal of transaction #' . $financialTransaction->id . ': ' . $financialTransaction->description;
            $reversal->reference_number = 'REV-' . $financialTransaction->reference_number;
            $reversal->transaction_date = now();
            $reversal->created_by = Auth::id();
            $reversal->updated_by = Auth::id();
            $reversal->approved_by = null;
            $reversal->approved_at = null;
            $reversal->posted_at = null;
            $reversal->save();

            // Update the original transaction
            $financialTransaction->update([
                'status' => 'Reversed',
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Financial transaction reversed successfully',
                'data' => [
                    'original' => new FinancialTransactionResource($financialTransaction),
                    'reversal' => new FinancialTransactionResource($reversal)
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reverse financial transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
