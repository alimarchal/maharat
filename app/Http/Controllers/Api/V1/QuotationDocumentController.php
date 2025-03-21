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

        // Ensure the directory exists directly in storage/app/public
        if (!Storage::exists('public/quotations')) {
            Storage::makeDirectory('public/quotations');
            Log::info('Storage directory created: public/quotations');
        } else {
            Log::info('Storage directory already exists: public/quotations');
        }

        // Find existing document for this quotation
        $existingDocument = QuotationDocument::where('quotation_id', $request->quotation_id)->first();
        
        // Store the file directly in storage/app/public/quotations (without double public)
        $fileName = time() . '_' . $request->file('document')->getClientOriginalName();
        $path = $request->file('document')->storeAs('public/quotations', $fileName);
        Log::info('File stored at: ' . $path);

        // Remove 'public/' prefix so the file is accessible via `/storage/`
        $relativePath = str_replace('public/', '', $path);
        
        if ($existingDocument) {
            // Delete old file if it exists
            if ($existingDocument->file_path) {
                $oldPath = 'public/' . $existingDocument->file_path;
                if (Storage::exists($oldPath)) {
                    Storage::delete($oldPath);
                    Log::info('Old file deleted: ' . $oldPath);
                }
            }
            
            // Update existing record
            $existingDocument->file_path = $relativePath;
            $existingDocument->original_name = $request->file('document')->getClientOriginalName();
            $existingDocument->type = $request->type;
            $existingDocument->save();
            
            Log::info('Database entry updated:', $existingDocument->toArray());
            
            return response()->json([
                'message' => 'File updated successfully',
                'file_path' => asset('storage/' . $relativePath),
                'document' => new QuotationDocumentResource($existingDocument)
            ], 200);
        } else {
            // Create new record
            $document = QuotationDocument::create([
                'quotation_id' => $request->quotation_id,
                'file_path' => $relativePath,
                'original_name' => $request->file('document')->getClientOriginalName(),
                'type' => $request->type
            ]);
            
            Log::info('Database entry created:', $document->toArray());
            
            return response()->json([
                'message' => 'File uploaded successfully',
                'file_path' => asset('storage/' . $relativePath),
                'document' => new QuotationDocumentResource($document)
            ], 201);
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

    public function update(Request $request, $id)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf,doc,docx',
            'type' => 'required|string'
        ]);

        $quotationDocument = QuotationDocument::findOrFail($id);

        // Delete old file if it exists
        if ($quotationDocument->file_path) {
            $oldPath = 'public/' . $quotationDocument->file_path;
            if (Storage::exists($oldPath)) {
                Storage::delete($oldPath);
                Log::info('Old file deleted: ' . $oldPath);
            }
        }

        // Store the file directly in storage/app/public/quotations (without double public)
        $fileName = time() . '_' . $request->file('document')->getClientOriginalName();
        $path = $request->file('document')->storeAs('public/quotations', $fileName);
        $relativePath = str_replace('public/', '', $path);

        // Update document details
        $quotationDocument->update([
            'file_path' => $relativePath,
            'original_name' => $request->file('document')->getClientOriginalName(),
            'type' => $request->type
        ]);

        return response()->json([
            'message' => 'File updated successfully',
            'file_path' => asset('storage/' . $relativePath),
            'document' => new QuotationDocumentResource($quotationDocument)
        ], 200);
    }

    public function destroy($id): JsonResponse
    {
        try {
            $document = QuotationDocument::findOrFail($id);
            
            // Delete the physical file
            if ($document->file_path) {
                $fullPath = 'public/' . $document->file_path;
                if (Storage::exists($fullPath)) {
                    Storage::delete($fullPath);
                    Log::info('File deleted: ' . $fullPath);
                }
            }

            // Delete the record
            $document->delete();

            return response()->json([
                'message' => 'Document deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            Log::error('Failed to delete document: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}