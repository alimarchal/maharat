<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ManualStep;
use App\Models\StepScreenshot;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class StepScreenshotController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created screenshot in storage.
     */
    public function store(Request $request, ManualStep $step): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'screenshot' => 'required|file|image|max:5120', // 5MB max
                'alt_text' => 'nullable|string|max:255',
                'caption' => 'nullable|string|max:500',
                'type' => 'nullable|string|in:image,diagram,chart',
                'order' => 'nullable|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Upload file
            $file = $request->file('screenshot');
            $path = $file->store('user-manuals/screenshots', 'public');
            
            // Create screenshot record
            $screenshot = new StepScreenshot([
                'manual_step_id' => $step->id,
                'screenshot_path' => $path,
                'screenshot_url' => Storage::url($path),
                'alt_text' => $request->alt_text,
                'caption' => $request->caption,
                'type' => $request->type ?? 'image',
                'order' => $request->order ?? ($step->screenshots()->count() + 1),
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize()
            ]);

            $step->screenshots()->save($screenshot);

            return response()->json([
                'success' => true,
                'message' => 'Screenshot uploaded successfully',
                'data' => $screenshot
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error uploading screenshot: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload screenshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified screenshot in storage.
     */
    public function update(Request $request, ManualStep $step, StepScreenshot $screenshot): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'screenshot' => 'nullable|file|image|max:5120', // 5MB max
                'alt_text' => 'nullable|string|max:255',
                'caption' => 'nullable|string|max:500',
                'type' => 'nullable|string|in:image,diagram,chart',
                'order' => 'nullable|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Only update if the screenshot belongs to this step
            if ($screenshot->step_id !== $step->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Screenshot does not belong to this step'
                ], 403);
            }

            // Update file if provided
            if ($request->hasFile('screenshot')) {
                // Delete old file
                if ($screenshot->screenshot_path) {
                    Storage::disk('public')->delete($screenshot->screenshot_path);
                }

                // Upload new file
                $file = $request->file('screenshot');
                $path = $file->store('user-manuals/screenshots', 'public');
                
                $screenshot->screenshot_path = $path;
                $screenshot->screenshot_url = Storage::url($path);
                $screenshot->file_name = $file->getClientOriginalName();
                $screenshot->mime_type = $file->getMimeType();
                $screenshot->size = $file->getSize();
            }

            // Update other fields
            if ($request->has('alt_text')) {
                $screenshot->alt_text = $request->alt_text;
            }
            
            if ($request->has('caption')) {
                $screenshot->caption = $request->caption;
            }
            
            if ($request->has('type')) {
                $screenshot->type = $request->type;
            }
            
            if ($request->has('order')) {
                $screenshot->order = $request->order;
            }

            $screenshot->save();

            return response()->json([
                'success' => true,
                'message' => 'Screenshot updated successfully',
                'data' => $screenshot
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating screenshot: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update screenshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified screenshot from storage.
     */
    public function destroy(ManualStep $step, StepScreenshot $screenshot): JsonResponse
    {
        try {
            // Only delete if the screenshot belongs to this step
            if ($screenshot->manual_step_id !== $step->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Screenshot does not belong to this step'
                ], 403);
            }

            // Delete file
            if ($screenshot->screenshot_path) {
                Storage::disk('public')->delete($screenshot->screenshot_path);
            }

            // Delete record
            $screenshot->delete();

            return response()->json([
                'success' => true,
                'message' => 'Screenshot deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting screenshot: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete screenshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
