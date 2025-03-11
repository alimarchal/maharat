<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Account\StoreLedgerRequest;
use App\Http\Requests\V1\Account\UpdateLedgerRequest;
use App\Http\Resources\V1\LedgerResource;
use App\Models\Ledger;
use App\QueryParameters\LedgerParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class LedgerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $ledgers = QueryBuilder::for(Ledger::class)
            ->allowedFilters(LedgerParameters::ALLOWED_FILTERS)
            ->allowedSorts(LedgerParameters::ALLOWED_SORTS)
            ->allowedIncludes(LedgerParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($ledgers->isEmpty()) {
            return response()->json([
                'message' => 'No ledgers found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return LedgerResource::collection($ledgers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLedgerRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ledger = Ledger::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Ledger created successfully',
                'data' => new LedgerResource($ledger->load(['costCenter', 'creator', 'updater']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create ledger',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $ledger = QueryBuilder::for(Ledger::class)
            ->allowedIncludes(LedgerParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new LedgerResource($ledger)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLedgerRequest $request, Ledger $ledger): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ledger->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Ledger updated successfully',
                'data' => new LedgerResource($ledger->load(['costCenter', 'creator', 'updater']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update ledger',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ledger $ledger): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ledger->delete();

            DB::commit();

            return response()->json([
                'message' => 'Ledger deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete ledger',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted ledger.
     */
    public function restore(Request $request, $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $ledger = Ledger::withTrashed()->findOrFail($id);
            $ledger->restore();

            DB::commit();

            return response()->json([
                'message' => 'Ledger restored successfully',
                'data' => new LedgerResource($ledger)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore ledger',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
