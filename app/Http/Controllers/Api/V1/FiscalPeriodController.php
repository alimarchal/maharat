<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\FiscalPeriod\StoreFiscalPeriodRequest;
use App\Http\Requests\V1\FiscalPeriod\UpdateFiscalPeriodRequest;
use App\Http\Resources\V1\FiscalPeriodResource;
use App\Http\Resources\V1\FiscalPeriodCollection;
use App\Models\FiscalPeriod;
use App\QueryParameters\FiscalPeriodParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class FiscalPeriodController extends Controller
{
    /**
     * Display a listing of fiscal periods.
     */
    public function index(): JsonResponse|FiscalPeriodCollection
    {
        $periods = QueryBuilder::for(FiscalPeriod::class)
            ->allowedFilters(FiscalPeriodParameters::ALLOWED_FILTERS)
            ->allowedSorts(FiscalPeriodParameters::ALLOWED_SORTS)
            ->allowedIncludes(FiscalPeriodParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($periods->isEmpty()) {
            return response()->json([
                'message' => 'No fiscal periods found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new FiscalPeriodCollection($periods);
    }

    /**
     * Store a newly created fiscal period in storage.
     */
    public function store(StoreFiscalPeriodRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $period = FiscalPeriod::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Fiscal period created successfully',
                'data' => new FiscalPeriodResource(
                    $period->load(['creator', 'updater'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create fiscal period',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified fiscal period.
     */
    public function show(string $id): JsonResponse
    {
        $period = QueryBuilder::for(FiscalPeriod::class)
            ->allowedIncludes(FiscalPeriodParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new FiscalPeriodResource($period)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified fiscal period in storage.
     */
    public function update(UpdateFiscalPeriodRequest $request, FiscalPeriod $fiscalPeriod): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Prevent updating closed periods unless specifically reopening them
            if ($fiscalPeriod->status === 'Closed' &&
                (!$request->has('status') || $request->status === 'Closed')) {
                return response()->json([
                    'message' => 'Cannot update a closed fiscal period',
                    'error' => 'The period must be reopened first'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $fiscalPeriod->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Fiscal period updated successfully',
                'data' => new FiscalPeriodResource(
                    $fiscalPeriod->load(['creator', 'updater'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update fiscal period',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified fiscal period from storage.
     */
    public function destroy(FiscalPeriod $fiscalPeriod): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Prevent deleting closed periods
            if ($fiscalPeriod->status === 'Closed') {
                return response()->json([
                    'message' => 'Cannot delete a closed fiscal period',
                    'error' => 'Closed periods are permanent records'
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $fiscalPeriod->delete();

            DB::commit();

            return response()->json([
                'message' => 'Fiscal period deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete fiscal period',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted fiscal period.
     */
    public function restore(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'id' => 'required|exists:fiscal_periods,id,deleted_at,!NULL'
            ]);

            $period = FiscalPeriod::withTrashed()->findOrFail($validated['id']);
            $period->restore();

            DB::commit();

            return response()->json([
                'message' => 'Fiscal period restored successfully',
                'data' => new FiscalPeriodResource($period)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to restore fiscal period',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Close a fiscal period.
     */
    public function close(FiscalPeriod $fiscalPeriod): JsonResponse
    {
        try {
            DB::beginTransaction();

            if ($fiscalPeriod->status === 'Closed') {
                return response()->json([
                    'message' => 'Fiscal period is already closed'
                ], Response::HTTP_OK);
            }

            // Here you might want to add business logic to verify all transactions
            // are properly posted before closing the period

            $fiscalPeriod->update([
                'status' => 'Closed',
                'updated_by' => auth()->id()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Fiscal period closed successfully',
                'data' => new FiscalPeriodResource($fiscalPeriod)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to close fiscal period',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Reopen a closed fiscal period.
     */
    public function reopen(FiscalPeriod $fiscalPeriod): JsonResponse
    {
        try {
            DB::beginTransaction();

            if ($fiscalPeriod->status !== 'Closed') {
                return response()->json([
                    'message' => 'Fiscal period is not closed'
                ], Response::HTTP_OK);
            }

            // Additional permission checks could be added here
            // as reopening closed periods is typically restricted

            $fiscalPeriod->update([
                'status' => 'Adjusting',
                'updated_by' => auth()->id()
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Fiscal period reopened for adjustments',
                'data' => new FiscalPeriodResource($fiscalPeriod)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reopen fiscal period',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
