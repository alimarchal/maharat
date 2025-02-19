<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\QuotationDocument\StoreQuotationDocumentRequest;
use App\Http\Requests\V1\QuotationDocument\UpdateQuotationDocumentRequest;
use App\Http\Resources\V1\QuotationDocumentResource;
use App\Models\QuotationDocument;
use App\QueryParameters\QuotationDocumentParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\QueryBuilder;

class QuotationDocumentController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $documents = QueryBuilder::for(QuotationDocument::class)
            ->allowedFilters(QuotationDocumentParameters::ALLOWED_FILTERS)
            ->allowedSorts(QuotationDocumentParameters::ALLOWED_SORTS)
            ->allowedIncludes(QuotationDocumentParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($documents->isEmpty()) {
            return response()->json([
                'message' => 'No documents found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return QuotationDocumentResource::collection($documents);
    }

    public function store(StoreQuotationDocumentRequest $request): JsonResponse
    {
        try {
            if ($request->hasFile('document')) {
                $path = $request->file('document')->store('quotations');

                $document = QuotationDocument::create([
                    'quotation_id' => $request->quotation_id,
                    'file_path' => $path,
                    'original_name' => $request->file('document')->getClientOriginalName(),
                    'type' => $request->type
                ]);

                return response()->json([
                    'message' => 'Document uploaded successfully',
                    'data' => new QuotationDocumentResource($document->load('quotation'))
                ], Response::HTTP_CREATED);
            }

            return response()->json([
                'message' => 'No document provided'
            ], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $document = QueryBuilder::for(QuotationDocument::class)
            ->allowedIncludes(QuotationDocumentParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new QuotationDocumentResource($document)
        ], Response::HTTP_OK);
    }

    public function update(UpdateQuotationDocumentRequest $request, QuotationDocument $document): JsonResponse
    {
        try {
            if ($request->hasFile('document')) {
                // Delete old file
                Storage::delete($document->file_path);

                // Store new file
                $path = $request->file('document')->store('quotations');

                $document->update([
                    'file_path' => $path,
                    'original_name' => $request->file('document')->getClientOriginalName(),
                    'type' => $request->type ?? $document->type
                ]);
            } else {
                $document->update($request->validated());
            }

            return response()->json([
                'message' => 'Document updated successfully',
                'data' => new QuotationDocumentResource($document->load('quotation'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(QuotationDocument $document): JsonResponse
    {
        try {
            // Delete the physical file
            Storage::delete($document->file_path);

            // Delete the record
            $document->delete();

            return response()->json([
                'message' => 'Document deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
