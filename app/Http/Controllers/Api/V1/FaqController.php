<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FaqController extends Controller
{
    public function index()
    {
        try {
            $faqs = Faq::orderBy('order', 'asc')->get();
            return response()->json($faqs);
        } catch (\Exception $e) {
            \Log::error('Error fetching FAQs: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch FAQs'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Starting FAQ creation', ['request_data' => $request->all()]);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'question' => 'required|string|max:255',
                'description' => 'required|string',
                'screenshots' => 'nullable|array',
                'screenshots.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'video_link' => 'nullable|url|max:255',
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $faq = new Faq();
            $faq->title = $validated['title'];
            $faq->question = $validated['question'];
            $faq->description = $validated['description'];
            $faq->video_link = $validated['video_link'] ?? null;

            // Handle screenshots
            if ($request->hasFile('screenshots')) {
                \Log::info('Processing screenshots', ['count' => count($request->file('screenshots'))]);
                
                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    if ($file) {
                        try {
                            // Store the file and get the relative path
                            $path = $file->store('faq/screenshots', 'public');
                            // Clean the path to remove any full URL
                            $path = str_replace('public/', '', $path);
                            $screenshots[] = $path;
                            \Log::info('Screenshot stored', ['path' => $path]);
                        } catch (\Exception $e) {
                            \Log::error('Error storing screenshot', ['error' => $e->getMessage()]);
                            throw $e;
                        }
                    }
                }
                $faq->screenshots = !empty($screenshots) ? json_encode($screenshots) : null;
            }

            // Set order to be the last
            $lastOrder = Faq::max('order') ?? 0;
            $faq->order = $lastOrder + 1;

            \Log::info('Saving FAQ', ['faq_data' => $faq->toArray()]);
            $faq->save();

            DB::commit();
            \Log::info('FAQ created successfully', ['faq_id' => $faq->id]);

            return response()->json($faq, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Validation error in FAQ creation', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating FAQ', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to create FAQ', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Faq $faq)
    {
        try {
            \Log::info('Starting FAQ update', ['faq_id' => $faq->id, 'request_data' => $request->all()]);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'question' => 'required|string|max:255',
                'description' => 'required|string',
                'screenshots' => 'nullable|array',
                'screenshots.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'video_link' => 'nullable|url|max:255',
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $faq->title = $validated['title'];
            $faq->question = $validated['question'];
            $faq->description = $validated['description'];
            $faq->video_link = $validated['video_link'] ?? null;

            // Handle screenshots
            if ($request->hasFile('screenshots')) {
                \Log::info('Processing screenshots', ['count' => count($request->file('screenshots'))]);
                
                // Delete old screenshots if they exist
                if ($faq->screenshots) {
                    $oldScreenshots = json_decode($faq->screenshots, true);
                    if (is_array($oldScreenshots)) {
                        foreach ($oldScreenshots as $oldScreenshot) {
                            if (Storage::disk('public')->exists($oldScreenshot)) {
                                Storage::disk('public')->delete($oldScreenshot);
                            }
                        }
                    }
                }

                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    if ($file) {
                        try {
                            // Store the file and get the relative path
                            $path = $file->store('faq/screenshots', 'public');
                            // Clean the path to remove any full URL
                            $path = str_replace('public/', '', $path);
                            $screenshots[] = $path;
                            \Log::info('Screenshot stored', ['path' => $path]);
                        } catch (\Exception $e) {
                            \Log::error('Error storing screenshot', ['error' => $e->getMessage()]);
                            throw $e;
                        }
                    }
                }
                $faq->screenshots = !empty($screenshots) ? json_encode($screenshots) : null;
            }

            \Log::info('Saving FAQ', ['faq_data' => $faq->toArray()]);
            $faq->save();

            DB::commit();
            \Log::info('FAQ updated successfully', ['faq_id' => $faq->id]);

            return response()->json($faq);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Validation error in FAQ update', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating FAQ', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'faq_id' => $faq->id
            ]);
            return response()->json(['message' => 'Failed to update FAQ', 'error' => $e->getMessage()], 500);
        }
    }

    public function reorder(Request $request)
    {
        try {
            \Log::info('Starting FAQ reorder', ['request' => $request->all()]);
            
            $validated = $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|exists:faqs,id',
                'items.*.order' => 'required|integer|min:0'
            ]);

            \DB::beginTransaction();

            foreach ($validated['items'] as $item) {
                \Log::info('Updating FAQ order', [
                    'id' => $item['id'],
                    'order' => $item['order']
                ]);
                
                Faq::where('id', $item['id'])->update([
                    'order' => $item['order']
                ]);
            }

            \DB::commit();

            // Return the updated FAQs in order
            $faqs = Faq::orderBy('order')->get();
            
            \Log::info('FAQ reorder completed successfully', [
                'updated_count' => count($validated['items']),
                'total_faqs' => $faqs->count()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'FAQs reordered successfully',
                'data' => $faqs
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error reordering FAQs: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder FAQs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Faq $faq)
    {
        try {
            DB::beginTransaction();

            // Delete screenshots if they exist
            if ($faq->screenshots) {
                $screenshots = json_decode($faq->screenshots, true);
                foreach ($screenshots as $screenshot) {
                    Storage::disk('public')->delete($screenshot);
                }
            }

            $faq->delete();

            DB::commit();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting FAQ: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete FAQ'], 500);
        }
    }
}
