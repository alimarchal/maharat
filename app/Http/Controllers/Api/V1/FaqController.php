<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Faq\StoreFaqRequest;
use App\Http\Requests\V1\Faq\UpdateFaqRequest;
use App\Http\Resources\V1\FaqResource;
use App\Http\Resources\V1\FaqCollection;
use App\Models\Faq;
use App\QueryParameters\FaqParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\QueryBuilder;

class FaqController extends Controller
{
    /**
     * Display a listing of the FAQs.
     *
     * @return \Illuminate\Http\JsonResponse|\App\Http\Resources\V1\FaqCollection
     */
    public function index(): JsonResponse|FaqCollection
    {
        $faqs = QueryBuilder::for(Faq::class)
            ->allowedFilters(FaqParameters::ALLOWED_FILTERS)
            ->allowedSorts(FaqParameters::ALLOWED_SORTS)
            ->allowedIncludes(FaqParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($faqs->isEmpty()) {
            return response()->json([
                'message' => 'No FAQs found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new FaqCollection($faqs);
    }

    /**
     * Store a newly created FAQ in storage.
     *
     * @param  \App\Http\Requests\V1\Faq\StoreFaqRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreFaqRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Handle screenshots upload
            if ($request->hasFile('screenshots')) {
                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    $path = $file->store('faqs/screenshots', 'public');
                    $screenshots[] = $path;
                }
                $data['screenshots'] = $screenshots;
            }

            $faq = Faq::create($data);

            DB::commit();

            return response()->json([
                'message' => 'FAQ created successfully',
                'data' => new FaqResource($faq)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create FAQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified FAQ.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $faq = QueryBuilder::for(Faq::class)
            ->allowedIncludes(FaqParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new FaqResource($faq)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified FAQ in storage.
     *
     * @param  \App\Http\Requests\V1\Faq\UpdateFaqRequest  $request
     * @param  \App\Models\Faq  $faq
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateFaqRequest $request, Faq $faq): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Handle screenshots upload
            if ($request->hasFile('screenshots')) {
                // Delete old screenshots if they exist
                if ($faq->screenshots) {
                    foreach ($faq->screenshots as $screenshot) {
                        Storage::disk('public')->delete($screenshot);
                    }
                }

                $screenshots = [];
                foreach ($request->file('screenshots') as $file) {
                    $path = $file->store('faqs/screenshots', 'public');
                    $screenshots[] = $path;
                }
                $data['screenshots'] = $screenshots;
            }

            $faq->update($data);

            DB::commit();

            return response()->json([
                'message' => 'FAQ updated successfully',
                'data' => new FaqResource($faq)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update FAQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified FAQ from storage.
     *
     * @param  \App\Models\Faq  $faq
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Faq $faq): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete associated screenshots if they exist
            if ($faq->screenshots) {
                foreach ($faq->screenshots as $screenshot) {
                    Storage::disk('public')->delete($screenshot);
                }
            }

            $faq->delete();

            DB::commit();

            return response()->json([
                'message' => 'FAQ deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete FAQ',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
