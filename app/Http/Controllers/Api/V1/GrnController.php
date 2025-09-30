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
        $maxAttempts = 10;
        $attempt = 0;
        
        do {
            $attempt++;
            $year = date('Y');
            $lastGrn = Grn::whereYear('created_at', $year)
                ->orderBy('grn_number', 'desc')
                ->first();

            if ($lastGrn) {
                // Extract the numeric part (last 5 digits) and increment
                $lastNumber = (int) substr($lastGrn->grn_number, -5);
                $newNumber = $lastNumber + 1;
            } else {
                $newNumber = 1;
            }

            // Format with leading zeros to maintain 5 digits
            $grnNumber = sprintf("GRN-%s-%05d", $year, $newNumber);
            
            // Check if this number already exists (race condition protection)
            $exists = Grn::where('grn_number', $grnNumber)->exists();
            
            if (!$exists) {
                return $grnNumber;
            }
            
            // If we've tried too many times, use a timestamp-based approach
            if ($attempt >= $maxAttempts) {
                $timestamp = time();
                return sprintf("GRN-%s-%05d", $year, $timestamp % 100000);
            }
            
        } while (true);
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

            // Update material request status if GRN is issued against a purchase order
            if ($grn->purchase_order_id) {
                $this->updateMaterialRequestStatusFromGRN($grn);
            }

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

    /**
     * Update material request status when GRN is issued against a purchase order
     */
    private function updateMaterialRequestStatusFromGRN(Grn $grn): void
    {
        try {
            // Get the purchase order and its related RFQ
            $purchaseOrder = $grn->purchaseOrder()->with('rfq')->first();
            
            if (!$purchaseOrder || !$purchaseOrder->rfq) {
                \Log::warning('GRN Status Update: Purchase order or RFQ not found', [
                    'grn_id' => $grn->id,
                    'purchase_order_id' => $grn->purchase_order_id
                ]);
                return;
            }

            $rfq = $purchaseOrder->rfq;
            
            \Log::info('GRN Status Update: Processing GRN for material request update', [
                'grn_id' => $grn->id,
                'grn_number' => $grn->grn_number,
                'purchase_order_id' => $purchaseOrder->id,
                'rfq_id' => $rfq->id,
                'rfq_number' => $rfq->rfq_number
            ]);

            // Find material requests that match this RFQ's details
            // Material requests are linked to RFQs by matching department, cost center, sub cost center, and warehouse
            $materialRequests = \App\Models\MaterialRequest::where('status_id', 2) // Referred status
                ->where('department_id', $rfq->department_id)
                ->where('cost_center_id', $rfq->cost_center_id)
                ->where('sub_cost_center_id', $rfq->sub_cost_center_id)
                ->where('warehouse_id', $rfq->warehouse_id)
                ->get();

            \Log::info('GRN Status Update: Found matching material requests', [
                'grn_id' => $grn->id,
                'rfq_id' => $rfq->id,
                'matching_requests_count' => $materialRequests->count(),
                'search_criteria' => [
                    'department_id' => $rfq->department_id,
                    'cost_center_id' => $rfq->cost_center_id,
                    'sub_cost_center_id' => $rfq->sub_cost_center_id,
                    'warehouse_id' => $rfq->warehouse_id
                ]
            ]);

            foreach ($materialRequests as $materialRequest) {
                // Update material request status to Approved (status_id = 4)
                $materialRequest->update([
                    'status_id' => 4, // Approved status
                    'updated_at' => now()
                ]);

                \Log::info('GRN Status Update: Material request status updated', [
                    'grn_id' => $grn->id,
                    'material_request_id' => $materialRequest->id,
                    'old_status_id' => 2, // Referred
                    'new_status_id' => 4, // Approved
                    'rfq_id' => $rfq->id
                ]);
            }

            if ($materialRequests->isEmpty()) {
                \Log::warning('GRN Status Update: No matching material requests found', [
                    'grn_id' => $grn->id,
                    'rfq_id' => $rfq->id,
                    'search_criteria' => [
                        'department_id' => $rfq->department_id,
                        'cost_center_id' => $rfq->cost_center_id,
                        'sub_cost_center_id' => $rfq->sub_cost_center_id,
                        'warehouse_id' => $rfq->warehouse_id
                    ]
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('GRN Status Update: Failed to update material request status', [
                'grn_id' => $grn->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
