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
use Illuminate\Http\Request;

class QuotationController extends Controller
{
    private function generateQuotationNumber(): string
    {
        $year = date('Y');
        $lastQuotation = Quotation::whereYear('created_at', $year)
            ->orderBy('quotation_number', 'desc')
            ->first();

        $newNumber = $lastQuotation ? ((int) substr($lastQuotation->quotation_number, -5)) + 1 : 1;
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

            $quotations = Quotation::with(['rfq.company', 'documents', 'status'])->paginate(10);
        
        return $quotations->isEmpty()
            ? response()->json(['message' => 'No quotations found', 'data' => []], Response::HTTP_OK)
            : QuotationResource::collection($quotations);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $quotationData = $request->safe()->except('documents');
            $quotationData['quotation_number'] = $this->generateQuotationNumber();
            $quotation = Quotation::create($quotationData);

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
            return response()->json(['message' => 'Failed to create quotation', 'error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $quotation = QueryBuilder::for(Quotation::class)
            ->allowedIncludes(QuotationParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json(['data' => new QuotationResource($quotation)], Response::HTTP_OK);
    }

    public function update(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);

        // Update the fields in the quotations table
        $quotation->update($request->except(['company_name', 'original_name', 'file_path']));

        // Check if the request contains organization_name and update the related RFQ
        if ($request->has('organization_name') && $quotation->rfq) {
            $quotation->rfq->update(['organization_name' => $request->input('organization_name')]);
        }

        // Check if the request contains original_name or file_path and update related documents
        if ($request->has('original_name') || $request->has('file_path')) {
            $quotation->documents()->update([
                'original_name' => $request->input('original_name', 'N/A'),
                'file_path' => $request->input('file_path', 'N/A'),
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function uploadTerms(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:2048',
            'quotation_id' => 'required|exists:quotations,id',
        ]);

        $quotation = Quotation::findOrFail($request->quotation_id);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('public/documents', $fileName); 

            // Save file path to database
            $quotation->terms_and_conditions = $filePath;
            $quotation->save();

            return response()->json([
                'success' => true,
                'file_path' => asset('storage/documents/' . $fileName), 
            ]);
        }

        return response()->json(['success' => false, 'message' => 'File upload failed.']);
    }


    public function destroy($id)
    {
        $quotation = Quotation::findOrFail($id);
        $quotation->delete();
        return response()->json(['success' => true]);
    }

    public function getByRfqId($rfqId)
    {
        try {
            \Log::info('Fetching quotations for RFQ ID: ' . $rfqId);

            $quotations = Quotation::with([
                'rfq' => function ($query) {
                    $query->select('rfq_number', 'organization_name');
                },
                'documents' => function ($query) {
                    $query->select('quotation_id', 'original_name', 'file_path');
                }
            ])
            ->where('rfq_id', $rfqId)
            ->paginate(10);

            \Log::info('Quotations found: ' . $quotations->count());
            \Log::info('Response data: ' . json_encode($quotations));

            return response()->json($quotations);
        } catch (\Exception $e) {
            \Log::error('Error fetching quotations: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to load quotations',
                'message' => $e->getMessage()
            ], 500);
        }
    }


}
