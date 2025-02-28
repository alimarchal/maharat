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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    public function store(Request $request)
    {
        Log::info('File upload request received', $request->all());

        $request->validate([
            'quotation_id' => 'required|exists:quotations,id',
            'document' => 'required|file|mimes:pdf,doc,docx',
            'type' => 'required|string'
        ]);

        // Ensure the directory exists
        if (!Storage::exists('public/quotations')) {
            Storage::makeDirectory('public/quotations');
            Log::info('Storage directory created: public/quotations');
        } else {
            Log::info('Storage directory already exists: public/quotations');
        }

        // Store the file and log the path
        $filePath = $request->file('document')->store('public/quotations');
        Log::info('File stored at: ' . $filePath);

        // Remove 'public/' prefix so the file is accessible via `/storage/`
        $relativePath = str_replace('public/', '', $filePath);

        // Save to the database
        $document = QuotationDocument::create([
            'quotation_id' => $request->quotation_id,
            'file_path' => $relativePath,
            'original_name' => $request->file('document')->getClientOriginalName(),
            'type' => $request->type
        ]);

        Log::info('Database entry created:', $document->toArray());

        return response()->json([
            'message' => 'File uploaded successfully',
            'file_path' => asset('storage/' . $document->file_path)
        ], 201);
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

    public function update(Request $request, $id)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf,doc,docx',
            'type' => 'required|string'
        ]);

        $quotationDocument = QuotationDocument::findOrFail($id);

        // Delete old file
        Storage::delete($quotationDocument->file_path);

        // Upload new file
        $filePath = $request->file('document')->store('quotations');

        // Update document details
        $quotationDocument->update([
            'file_path' => $filePath,
            'original_name' => $request->file('document')->getClientOriginalName(),
            'type' => $request->type
        ]);

        return response()->json([
            'message' => 'File updated successfully',
            'file_path' => asset('storage/' . $filePath),
            'document' => new QuotationDocumentResource($quotationDocument)
        ], 200);
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
