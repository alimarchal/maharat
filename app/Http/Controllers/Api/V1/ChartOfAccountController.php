<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ChartOfAccount\StoreChartOfAccountRequest;
use App\Http\Requests\V1\ChartOfAccount\UpdateChartOfAccountRequest;
use App\Http\Resources\V1\ChartOfAccountResource;
use App\Http\Resources\V1\ChartOfAccountCollection;
use App\Models\ChartOfAccount;
use App\QueryParameters\ChartOfAccountParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class ChartOfAccountController extends Controller
{
    /**
     * Display a listing of chart of accounts.
     */
    public function index(): JsonResponse|ChartOfAccountCollection
    {
        $accounts = QueryBuilder::for(ChartOfAccount::class)
            ->allowedFilters(ChartOfAccountParameters::ALLOWED_FILTERS)
            ->allowedSorts(ChartOfAccountParameters::ALLOWED_SORTS)
            ->allowedIncludes(ChartOfAccountParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($accounts->isEmpty()) {
            return response()->json([
                'message' => 'No chart of accounts found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new ChartOfAccountCollection($accounts);
    }

    /**
     * Store a newly created chart of account in storage.
     */
    public function store(StoreChartOfAccountRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $account = ChartOfAccount::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Chart of account created successfully',
                'data' => new ChartOfAccountResource(
                    $account->load(['parent', 'children'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create chart of account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified chart of account.
     */
    public function show(string $id): JsonResponse
    {
        $account = QueryBuilder::for(ChartOfAccount::class)
            ->allowedIncludes(ChartOfAccountParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ChartOfAccountResource($account)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified chart of account in storage.
     */
    public function update(UpdateChartOfAccountRequest $request, ChartOfAccount $chartOfAccount): JsonResponse
    {
        try {
            DB::beginTransaction();

            $chartOfAccount->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Chart of account updated successfully',
                'data' => new ChartOfAccountResource(
                    $chartOfAccount->load(['parent', 'children'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update chart of account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified chart of account from storage.
     */
    public function destroy(ChartOfAccount $chartOfAccount): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check if the account has children
            if ($chartOfAccount->children()->exists()) {
                return response()->json([
                    'message' => 'Cannot delete chart of account with children',
                    'error' => 'Delete child accounts first or reassign them'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $chartOfAccount->delete();

            DB::commit();

            return response()->json([
                'message' => 'Chart of account deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete chart of account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted chart of account.
     */
    public function restore(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'id' => 'required|exists:chart_of_accounts,id,deleted_at,!NULL'
            ]);

            $account = ChartOfAccount::withTrashed()->findOrFail($validated['id']);
            $account->restore();

            DB::commit();

            return response()->json([
                'message' => 'Chart of account restored successfully',
                'data' => new ChartOfAccountResource($account)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore chart of account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get chart of accounts in tree structure.
     */
    public function tree(): JsonResponse
    {
        $accounts = ChartOfAccount::whereNull('parent_account_id')
            ->with('children.children')
            ->get();

        return response()->json([
            'data' => ChartOfAccountResource::collection($accounts)
        ], Response::HTTP_OK);
    }
}
