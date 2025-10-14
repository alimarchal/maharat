<?php
// IMPORTANT: Ensure you have run 'php artisan storage:link' so that /storage points to storage/app/public for public file access.

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

    public function store(StoreQuotationDocumentRequest $request)
    {
        Log::info('File upload request received', $request->all());
        Log::info('File details:', [
            'file_name' => $request->file('document')->getClientOriginalName(),
            'file_size' => $request->file('document')->getSize(),
            'file_mime' => $request->file('document')->getMimeType(),
            'file_extension' => $request->file('document')->getClientOriginalExtension()
        ]);

        // Ensure the directory exists directly in storage/app/public/quotations
        $storageDir = 'quotations';
        if (!Storage::disk('public')->exists($storageDir)) {
            Storage::disk('public')->makeDirectory($storageDir);
            Log::info('Storage directory created: ' . $storageDir);
        } else {
            Log::info('Storage directory already exists: ' . $storageDir);
        }

        // Find existing document for this quotation
        $existingDocument = QuotationDocument::where('quotation_id', $request->quotation_id)->first();
        
        // Store the file directly in storage/app/public/quotations using the public disk
        try {
            $fileName = time() . '_' . $request->file('document')->getClientOriginalName();
            $path = $request->file('document')->storeAs($storageDir, $fileName, 'public');
            Log::info('File stored at: ' . $path);
            
            if (!$path) {
                Log::error('Failed to store file');
                return response()->json([
                    'message' => 'Failed to store file',
                    'success' => false
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('File storage error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to store file: ' . $e->getMessage(),
                'success' => false
            ], 500);
        }

        // Store the relative path as 'quotations/filename.pdf'
        $relativePath = 'quotations/' . $fileName;
        
        if ($existingDocument) {
            // Delete old file if it exists
            if ($existingDocument->file_path) {
                $oldPath = $existingDocument->file_path;
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
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
                'document' => new QuotationDocumentResource($existingDocument),
                'success' => true
            ], 200);
        } else {
            // Create new record
            try {
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
                    'document' => new QuotationDocumentResource($document),
                    'success' => true
                ], 201);
            } catch (\Exception $e) {
                Log::error('Database creation error: ' . $e->getMessage());
                // Delete the uploaded file if database creation fails
                if (Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
                return response()->json([
                    'message' => 'Failed to create database record: ' . $e->getMessage(),
                    'success' => false
                ], 500);
            }
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

    public function update(UpdateQuotationDocumentRequest $request, $id)
    {

        $quotationDocument = QuotationDocument::findOrFail($id);

        // Delete old file if it exists
        if ($quotationDocument->file_path) {
            $oldPath = $quotationDocument->file_path;
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
                Log::info('Old file deleted: ' . $oldPath);
            }
        }

        // Store the file directly in storage/app/public/quotations using the public disk
        $storageDir = 'quotations';
        $fileName = time() . '_' . $request->file('document')->getClientOriginalName();
        $path = $request->file('document')->storeAs($storageDir, $fileName, 'public');
        $relativePath = 'quotations/' . $fileName;

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
                $fullPath = $document->file_path;
                if (Storage::disk('public')->exists($fullPath)) {
                    Storage::disk('public')->delete($fullPath);
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