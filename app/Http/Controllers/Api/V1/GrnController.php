<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Grn\StoreGrnRequest;
use App\Http\Requests\V1\Grn\UpdateGrnRequest;
use App\Http\Resources\V1\GrnResource;
use App\Models\Grn;
use App\QueryParameters\GrnParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class GrnController extends Controller
{
    /**
     * Generate a unique GRN number
     * Format: GRN-YYYY-XXXXX (e.g., GRN-2025-00001)
     */
    private function generateGrnNumber(): string
    {
        $year = date('Y');
        $lastGrn = Grn::whereYear('created_at', $year)
            ->orderBy('grn_number', 'desc')
            ->first();

        if ($lastGrn) {
            // Extract the numeric part and increment
            $lastNumber = (int) substr($lastGrn->grn_number, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format with leading zeros to maintain 5 digits
        return sprintf("GRN-%s-%05d", $year, $newNumber);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $grns = QueryBuilder::for(Grn::class)
            ->allowedFilters(GrnParameters::ALLOWED_FILTERS)
            ->allowedSorts(GrnParameters::ALLOWED_SORTS)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($grns->isEmpty()) {
            return response()->json([
                'message' => 'No GRNs found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return GrnResource::collection($grns);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGrnRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Auto-generate GRN number if not provided
            if (!isset($validated['grn_number'])) {
                $validated['grn_number'] = $this->generateGrnNumber();
            }


            // Set current user as creator if not specified
            if (!isset($validated['user_id'])) {
                $validated['user_id'] = auth()->id();
            }

            $grn = Grn::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'GRN created successfully',
                'data' => new GrnResource(
                    $grn->load(['user', 'quotation', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $grn = QueryBuilder::for(Grn::class)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new GrnResource($grn)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGrnRequest $request, Grn $grn): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grn->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'GRN updated successfully',
                'data' => new GrnResource(
                    $grn->load(['user', 'quotation', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Grn $grn): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grn->delete();

            DB::commit();

            return response()->json([
                'message' => 'GRN deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
