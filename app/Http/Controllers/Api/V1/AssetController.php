<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Asset\StoreAssetRequest;
use App\Http\Requests\V1\Asset\UpdateAssetRequest;
use App\Http\Resources\V1\AssetResource;
use App\Http\Resources\V1\AssetCollection;
use App\Models\Asset;
use App\QueryParameters\AssetParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class AssetController extends Controller
{
    /**
     * Display a listing of assets.
     */
    public function index(): JsonResponse|AssetCollection
    {
        $assets = QueryBuilder::for(Asset::class)
            ->allowedFilters(AssetParameters::ALLOWED_FILTERS)
            ->allowedSorts(AssetParameters::ALLOWED_SORTS)
            ->allowedIncludes(AssetParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($assets->isEmpty()) {
            return response()->json([
                'message' => 'No assets found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new AssetCollection($assets);
    }

    /**
     * Store a newly created asset in storage.
     */
    public function store(StoreAssetRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Generate asset code if not provided
            if (!isset($validated['asset_code'])) {
                $validated['asset_code'] = Asset::generateAssetCode();
            }

            $asset = Asset::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Asset created successfully',
                'data' => new AssetResource($asset)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create asset',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified asset.
     */
    public function show(Asset $asset): JsonResponse
    {
        return response()->json([
            'data' => new AssetResource($asset)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified asset in storage.
     */
    public function update(UpdateAssetRequest $request, Asset $asset): JsonResponse
    {
        try {
            DB::beginTransaction();

            $asset->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Asset updated successfully',
                'data' => new AssetResource($asset)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update asset',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified asset from storage.
     */
    public function destroy(Asset $asset): JsonResponse
    {
        try {
            DB::beginTransaction();

            $asset->delete();

            DB::commit();

            return response()->json([
                'message' => 'Asset deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete asset',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore a soft-deleted asset.
     */
    public function restore($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $asset = Asset::withTrashed()->findOrFail($id);
            $asset->restore();

            DB::commit();

            return response()->json([
                'message' => 'Asset restored successfully',
                'data' => new AssetResource($asset)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to restore asset',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
