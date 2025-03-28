<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\EquityAccount\StoreEquityAccountRequest;
use App\Http\Requests\V1\EquityAccount\UpdateEquityAccountRequest;
use App\Http\Resources\V1\EquityAccountResource;
use App\Http\Resources\V1\EquityAccountCollection;
use App\Models\EquityAccount;
use App\QueryParameters\EquityAccountParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class EquityAccountController extends Controller
{
    /**
     * Display a listing of equity accounts.
     */
    public function index(): JsonResponse|EquityAccountCollection
    {
        $equityAccounts = QueryBuilder::for(EquityAccount::class)
            ->allowedFilters(EquityAccountParameters::ALLOWED_FILTERS)
            ->allowedSorts(EquityAccountParameters::ALLOWED_SORTS)
            ->allowedIncludes(EquityAccountParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($equityAccounts->isEmpty()) {
            return response()->json([
                'message' => 'No equity accounts found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new EquityAccountCollection($equityAccounts);
    }

    /**
     * Store a newly created equity account in storage.
     */
    public function store(StoreEquityAccountRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Generate account code if not provided
            if (!isset($validated['account_code'])) {
                $validated['account_code'] = EquityAccount::generateAccountCode($validated['type']);
            }

            $equityAccount = EquityAccount::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Equity account created successfully',
                'data' => new EquityAccountResource($equityAccount->load(['creator', 'updater']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create equity account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified equity account.
     */
    public function show(EquityAccount $equityAccount): JsonResponse
    {
        return response()->json([
            'data' => new EquityAccountResource($equityAccount->load(['creator', 'updater']))
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified equity account in storage.
     */
    public function update(UpdateEquityAccountRequest $request, EquityAccount $equityAccount): JsonResponse
    {
        try {
            DB::beginTransaction();

            $equityAccount->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Equity account updated successfully',
                'data' => new EquityAccountResource($equityAccount->load(['creator', 'updater']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update equity account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified equity account from storage.
     */
    public function destroy(EquityAccount $equityAccount): JsonResponse
    {
        try {
            DB::beginTransaction();

            $equityAccount->delete();

            DB::commit();

            return response()->json([
                'message' => 'Equity account deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete equity account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted equity account.
     */
    public function restore($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $equityAccount = EquityAccount::withTrashed()->findOrFail($id);
            $equityAccount->restore();

            DB::commit();

            return response()->json([
                'message' => 'Equity account restored successfully',
                'data' => new EquityAccountResource($equityAccount)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore equity account',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get equity accounts by type.
     */
    public function getByType(string $type): JsonResponse|EquityAccountCollection
    {
        $validTypes = ['owner_capital', 'retained_earnings', 'drawings', 'contributed_capital', 'treasury_stock', 'other_equity'];

        if (!in_array($type, $validTypes)) {
            return response()->json([
                'message' => 'Invalid equity account type',
                'error' => 'Type must be one of: ' . implode(', ', $validTypes)
            ], Response::HTTP_BAD_REQUEST);
        }

        $equityAccounts = QueryBuilder::for(EquityAccount::class)
            ->where('type', $type)
            ->allowedSorts(EquityAccountParameters::ALLOWED_SORTS)
            ->allowedIncludes(EquityAccountParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($equityAccounts->isEmpty()) {
            return response()->json([
                'message' => "No equity accounts found with type: {$type}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return new EquityAccountCollection($equityAccounts);
    }
}
