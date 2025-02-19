<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Quotation\StoreQuotationRequest;
use App\Http\Requests\V1\Quotation\UpdateQuotationRequest;
use App\Http\Resources\V1\QuotationResource;
use App\Models\Quotation;
use App\QueryParameters\QuotationParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class QuotationController extends Controller
{
    /**
     * Generate a unique quotation number
     * Format: QUO-YYYY-XXXXX (e.g., QUO-2025-00001)
     */
    private function generateQuotationNumber(): string
    {
        $year = date('Y');
        $lastQuotation = Quotation::whereYear('created_at', $year)
            ->orderBy('quotation_number', 'desc')
            ->first();

        if ($lastQuotation) {
            // Extract the numeric part and increment
            $lastNumber = (int) substr($lastQuotation->quotation_number, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format with leading zeros to maintain 5 digits
        return sprintf("QUO-%s-%05d", $year, $newNumber);
    }


    public function index(): JsonResponse|ResourceCollection
    {
        $quotations = QueryBuilder::for(Quotation::class)
            ->allowedFilters(QuotationParameters::ALLOWED_FILTERS)
            ->allowedSorts(QuotationParameters::ALLOWED_SORTS)
            ->allowedIncludes(QuotationParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($quotations->isEmpty()) {
            return response()->json([
                'message' => 'No quotations found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return QuotationResource::collection($quotations);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Generate unique quotation number
            $quotationData = $request->safe()->except('documents');
            $quotationData['quotation_number'] = $this->generateQuotationNumber();

            $quotation = Quotation::create($quotationData);

            // Handle document uploads if provided
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $document) {
                    $path = $document->store('quotations');
                    $quotation->documents()->create([
                        'file_path' => $path,
                        'original_name' => $document->getClientOriginalName(),
                        'type' => 'quotation'
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Quotation created successfully',
                'data' => new QuotationResource(
                    $quotation->load(['rfq', 'supplier', 'status', 'documents'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create quotation',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $quotation = QueryBuilder::for(Quotation::class)
            ->allowedIncludes(QuotationParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new QuotationResource($quotation)
        ], Response::HTTP_OK);
    }

    public function update(UpdateQuotationRequest $request, Quotation $quotation): JsonResponse
    {
        try {
            DB::beginTransaction();

            $quotation->update($request->safe()->except('documents'));

            // Handle document uploads if provided
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $document) {
                    $path = $document->store('quotations');
                    $quotation->documents()->create([
                        'file_path' => $path,
                        'original_name' => $document->getClientOriginalName(),
                        'type' => 'quotation'
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Quotation updated successfully',
                'data' => new QuotationResource(
                    $quotation->load(['rfq', 'supplier', 'status', 'documents'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update quotation',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete associated documents first
            $quotation->documents()->delete();

            // Delete the quotation
            $quotation->delete();

            DB::commit();

            return response()->json([
                'message' => 'Quotation deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete quotation',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
