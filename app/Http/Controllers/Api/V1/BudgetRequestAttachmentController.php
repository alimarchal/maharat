<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RequestBudget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class BudgetRequestAttachmentController extends Controller
{
    /**
     * Store a newly created attachment for a budget request.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'attachment' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240', // 10MB max
                'request_budget_id' => 'required|exists:request_budgets,id',
                'type' => 'required|string'
            ]);

            $file = $request->file('attachment');
            $budgetRequestId = $request->input('request_budget_id');
            $type = $request->input('type');

            // Generate unique filename
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Store file in budget-requests directory
            $path = $file->storeAs('budget-requests', $filename, 'public');

            // Update the budget request with the attachment path
            $budgetRequest = RequestBudget::findOrFail($budgetRequestId);
            $budgetRequest->update([
                'attachment_path' => $path,
                'original_name' => $file->getClientOriginalName()
            ]);

            return response()->json([
                'message' => 'Attachment uploaded successfully',
                'data' => [
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                ]
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload attachment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified attachment.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $budgetRequest = RequestBudget::findOrFail($id);
            
            if ($budgetRequest->attachment_path) {
                // Delete file from storage
                Storage::disk('public')->delete($budgetRequest->attachment_path);
                
                // Clear attachment path
                $budgetRequest->update(['attachment_path' => null]);
            }

            return response()->json([
                'message' => 'Attachment deleted successfully'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete attachment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
} 