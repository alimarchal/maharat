<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FaqApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class FaqApprovalController extends Controller
{
    public function view()
    {
        try {
            $faqs = FaqApproval::with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'data' => $faqs
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching FAQ approvals: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch FAQ approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Starting FAQ approval submission', ['request_data' => $request->all()]);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'screenshots' => 'nullable|array',
                'screenshots.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $faqApproval = new FaqApproval();
            $faqApproval->user_id = auth()->id();
            $faqApproval->title = $validated['title'];
            $faqApproval->description = $validated['description'];
            $faqApproval->status = 'pending';

            // Handle screenshots
            if ($request->hasFile('screenshots')) {
                \Log::info('Processing screenshots', ['count' => count($request->file('screenshots'))]);
                
                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    if ($file) {
                        try {
                            // Store the file and get the relative path
                            $path = $file->store('faq/approval/screenshots', 'public');
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
                $faqApproval->screenshots = $screenshots;
            }

            \Log::info('Saving FAQ approval', ['faq_approval_data' => $faqApproval->toArray()]);
            $faqApproval->save();

            DB::commit();
            \Log::info('FAQ approval created successfully', ['faq_approval_id' => $faqApproval->id]);

            return response()->json([
                'message' => 'FAQ submission received and pending approval',
                'data' => $faqApproval
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Validation error in FAQ approval submission', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error submitting FAQ for approval', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to submit FAQ for approval', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            \Log::info('Starting FAQ approval update', ['id' => $id, 'request_data' => $request->all()]);

            $faqApproval = FaqApproval::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:pending,approved,cancelled'
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            $faqApproval->status = $validated['status'];
            $faqApproval->save();

            DB::commit();
            \Log::info('FAQ approval updated successfully', ['id' => $id]);

            return response()->json([
                'message' => 'FAQ approval status updated successfully',
                'data' => $faqApproval
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Validation error in FAQ approval update', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating FAQ approval', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to update FAQ approval', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            \Log::info('Starting FAQ approval deletion', ['id' => $id]);

            DB::beginTransaction();

            $faqApproval = FaqApproval::findOrFail($id);

            // Delete screenshots if they exist
            if ($faqApproval->screenshots) {
                foreach ($faqApproval->screenshots as $screenshot) {
                    Storage::disk('public')->delete($screenshot);
                }
            }

            $faqApproval->delete();

            DB::commit();
            \Log::info('FAQ approval deleted successfully', ['id' => $id]);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting FAQ approval', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to delete FAQ approval', 'error' => $e->getMessage()], 500);
        }
    }
} 