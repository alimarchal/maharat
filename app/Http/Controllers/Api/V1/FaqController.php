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
            Log::error('Error fetching FAQs: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch FAQs'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'question' => 'required|string|max:255',
                'description' => 'required|string',
                'screenshots' => 'nullable|array',
                'screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
                'video_link' => 'nullable|url|max:255',
            ]);

            DB::beginTransaction();

            $faq = new Faq();
            $faq->title = $validated['title'];
            $faq->question = $validated['question'];
            $faq->description = $validated['description'];
            $faq->video_link = $validated['video_link'] ?? null;

            // Handle screenshots
            if ($request->hasFile('screenshots')) {
                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    $path = $file->store('faq/screenshots', 'public');
                    $screenshots[] = $path;
                }
                $faq->screenshots = json_encode($screenshots);
            }

            // Set order to be the last
            $lastOrder = Faq::max('order') ?? 0;
            $faq->order = $lastOrder + 1;

            $faq->save();

            DB::commit();

            return response()->json($faq, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating FAQ: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create FAQ'], 500);
        }
    }

    public function update(Request $request, Faq $faq)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'question' => 'required|string|max:255',
                'description' => 'required|string',
                'screenshots' => 'nullable|array',
                'screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
                'video_link' => 'nullable|url|max:255',
            ]);

            DB::beginTransaction();

            $faq->title = $validated['title'];
            $faq->question = $validated['question'];
            $faq->description = $validated['description'];
            $faq->video_link = $validated['video_link'] ?? null;

            // Handle screenshots
            if ($request->hasFile('screenshots')) {
                // Delete old screenshots
                if ($faq->screenshots) {
                    $oldScreenshots = json_decode($faq->screenshots, true);
                    foreach ($oldScreenshots as $oldScreenshot) {
                        Storage::disk('public')->delete($oldScreenshot);
                    }
                }

                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    $path = $file->store('faq/screenshots', 'public');
                    $screenshots[] = $path;
                }
                $faq->screenshots = json_encode($screenshots);
            }

            $faq->save();

            DB::commit();

            return response()->json($faq);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating FAQ: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update FAQ'], 500);
        }
    }

    public function reorder(Request $request)
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|exists:faqs,id',
                'items.*.order' => 'required|integer|min:0',
            ]);

            DB::beginTransaction();

            foreach ($validated['items'] as $item) {
                Faq::where('id', $item['id'])->update(['order' => $item['order']]);
            }

            DB::commit();

            return response()->json(['message' => 'FAQ order updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error reordering FAQs: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to reorder FAQs'], 500);
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
