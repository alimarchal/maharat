<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UploadController extends Controller
{
    /**
     * Upload a file to storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,txt|max:10240', // 10MB max
                'folder' => 'nullable|string|max:100', // Optional folder parameter
            ]);

            $file = $request->file('file');
            $folder = $request->input('folder', 'uploads'); // Default to 'uploads' folder

            // Generate unique filename
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Store file in the specified folder
            $path = $file->storeAs($folder, $filename, 'public');

            Log::info('File uploaded successfully', [
                'original_name' => $file->getClientOriginalName(),
                'stored_path' => $path,
                'folder' => $folder,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);

            return response()->json([
                'message' => 'File uploaded successfully',
                'file_path' => $path,
                'url' => Storage::disk('public')->url($path),
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to upload file',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
