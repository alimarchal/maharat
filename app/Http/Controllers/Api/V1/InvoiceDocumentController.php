<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InvoiceDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvoiceDocumentController extends Controller
{
    /**
     * Store a newly created document in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'document' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240',
                'invoice_id' => 'required|exists:external_invoices,id',
                'type' => 'string|in:invoice',
            ]);

            $file = $request->file('document');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('invoices', $fileName, 'public');

            $document = InvoiceDocument::create([
                'invoice_id' => $request->invoice_id,
                'file_path' => $filePath,
                'original_name' => $file->getClientOriginalName(),
                'type' => $request->type ?? 'invoice',
            ]);

            return response()->json([
                'message' => 'Document uploaded successfully',
                'data' => $document
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
