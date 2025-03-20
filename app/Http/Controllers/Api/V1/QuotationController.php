<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Quotation\StoreQuotationRequest;
use App\Http\Requests\V1\Quotation\UpdateQuotationRequest;
use App\Http\Resources\V1\QuotationResource;
use App\Models\Quotation;
use App\Models\Supplier;
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
        // Get query parameters
        $rfqId = request()->get('rfq_id');
        $query = Quotation::with(['rfq.company', 'documents', 'status', 'supplier']);
        // Filter by RFQ ID if provided
        if ($rfqId) {
            $query->where('rfq_id', $rfqId);
        }
        
        // Paginate the results
        $quotations = $query->paginate(10)->appends(request()->query());
        
        return $quotations->isEmpty()
            ? response()->json(['message' => 'No quotations found', 'data' => []], Response::HTTP_OK)
            : QuotationResource::collection($quotations);
    }

    public function store(Request $request)
    {
        $request->validate([
            'document' => 'required|file|max:10240',
            'quotation_id' => 'required|exists:quotations,id',
            'type' => 'required|string'
        ]);

        try {
            // Get the uploaded file
            $file = $request->file('document');
            $originalName = $file->getClientOriginalName();
            
            // Store file
            $path = $file->store('quotations');
            
            // Find existing document for this quotation
            $existingDocument = QuotationDocument::where('quotation_id', $request->quotation_id)->first();
            
            if ($existingDocument) {
                // Delete the old file if it exists
                if (Storage::exists($existingDocument->file_path)) {
                    Storage::delete($existingDocument->file_path);
                }
                
                // Update the existing record
                $existingDocument->update([
                    'file_path' => $path,
                    'original_name' => $originalName,
                    'type' => $request->type
                ]);
                
                $document = $existingDocument;
            } else {
                // Create a new document record
                $document = QuotationDocument::create([
                    'quotation_id' => $request->quotation_id,
                    'file_path' => $path,
                    'original_name' => $originalName,
                    'type' => $request->type
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => $document
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error uploading document: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        $quotation = Quotation::with(['rfq', 'supplier', 'status', 'documents'])
            ->findOrFail($id);

        return response()->json(['data' => new QuotationResource($quotation)], Response::HTTP_OK);
    }

    public function update(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);

        // Update the fields in the quotations table
        $quotation->update($request->except(['company_name', 'supplier_name', 'original_name', 'file_path', 'update_rfq', 'rfq_company_id']));

        // Check if the request contains organization_name and update the related RFQ
        if ($request->has('update_rfq') && $request->input('update_rfq') && $request->has('rfq_company_id')) {
            $rfqId = $quotation->rfq_id;
            DB::table('rfqs')->where('id', $rfqId)->update([
                'company_id' => $request->input('rfq_company_id')
            ]);
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
            'file' => 'required|mimes:pdf|max:10240',
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
        try {
            $document = QuotationDocument::findOrFail($id);
            
            // Delete the file from storage
            if (Storage::exists($document->file_path)) {
                Storage::delete($document->file_path);
            }
            
            // Delete the record
            $document->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting document: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByRfqId($rfqId)
    {
        try {
            \Log::info('Fetching quotations for RFQ ID: ' . $rfqId);

            $quotations = Quotation::with([
                'rfq' => function ($query) {
                    $query->select('id', 'rfq_number', 'company_id');
                },
                'supplier' => function ($query) {
                    $query->select('id', 'name', 'contact_person', 'email');
                },
                'documents' => function ($query) {
                    $query->select('id', 'quotation_id', 'original_name', 'file_path');
                }
            ])
            ->where('rfq_id', $rfqId)
            ->paginate(10);

            \Log::info('Quotations found: ' . $quotations->count());

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