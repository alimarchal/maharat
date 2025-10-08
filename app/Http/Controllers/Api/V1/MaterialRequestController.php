<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MaterialRequest\StoreMaterialRequestRequest;
use App\Http\Requests\V1\MaterialRequest\UpdateMaterialRequestRequest;
use App\Http\Resources\V1\MaterialRequestResource;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\QueryParameters\MaterialRequestParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\QueryBuilder;

class MaterialRequestController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $requests = QueryBuilder::for(MaterialRequest::class)
            ->allowedFilters(MaterialRequestParameters::ALLOWED_FILTERS)
            ->allowedSorts(MaterialRequestParameters::ALLOWED_SORTS)
            ->allowedIncludes(MaterialRequestParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($requests->isEmpty()) {
            return response()->json([
                'message' => 'No material requests found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MaterialRequestResource::collection($requests);
    }

    public function store(StoreMaterialRequestRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Create material request
            $materialRequest = MaterialRequest::create($request->safe()->except('items'));

            // Create material request items
            foreach ($request->input('items') as $index => $item) {
                $itemData = $item;
                
                // Handle photo upload if exists
                if ($request->hasFile("items.{$index}.photo")) {
                    $file = $request->file("items.{$index}.photo");
                    if ($file->isValid()) {
                        $path = $file->store('material-request-items', 'public');
                        $itemData['photo'] = $path;
                        \Log::info("Photo uploaded for item {$index}: {$path}");
                    } else {
                        \Log::error("Invalid file upload for item {$index}");
                    }
                } else {
                    // No photo file provided
                }
                
                $materialRequest->items()->create($itemData);
            }

            DB::commit();

            return response()->json([
                'message' => 'Material request created successfully',
                'data' => new MaterialRequestResource(
                    $materialRequest->load([
                        'requester',
                        'warehouse',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'status',
                        'items.product',
                        'items.unit',
                        'items.category',
                        'items.urgencyStatus'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create material request',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $request = QueryBuilder::for(MaterialRequest::class)
            ->allowedIncludes(MaterialRequestParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new MaterialRequestResource($request)
        ], Response::HTTP_OK);
    }

    public function update(UpdateMaterialRequestRequest $request, MaterialRequest $materialRequest): JsonResponse
    {
        \Log::info("=== MATERIAL REQUEST UPDATE STARTED ===");
        try {
            \Log::info("Material request update - Request data:", $request->all());
            \Log::info("Material request update - Files:", $request->allFiles());
            \Log::info("Material request update - Has items: " . ($request->has('items') ? 'true' : 'false'));
            \Log::info("Material request update - Items count: " . count($request->input('items', [])));
            
            DB::beginTransaction();

            // Update material request
            $materialRequest->update($request->safe()->except('items'));

            // Handle items update if provided
            if ($request->has('items')) {
                // Get existing items with their photos
                $existingItems = $materialRequest->items()->get()->keyBy('id');
                \Log::info("Existing items: " . json_encode($existingItems->toArray()));
                
                // Delete existing items
                $materialRequest->items()->delete();

                // Create new items with photo uploads
                foreach ($request->input('items') as $index => $item) {
                    \Log::info("Processing item {$index}: " . json_encode($item));
                    $itemData = $item;
                    
                    // Handle photo upload if exists
                    if ($request->hasFile("items.{$index}.photo")) {
                        $file = $request->file("items.{$index}.photo");
                        if ($file->isValid()) {
                            $path = $file->store('material-request-items', 'public');
                            $itemData['photo'] = $path;
                            \Log::info("New photo uploaded for item {$index}: {$path}");
                        }
                    } else {
                        // Preserve existing photo if no new file uploaded
                        if (isset($item['id']) && $existingItems->has($item['id'])) {
                            $existingItem = $existingItems->get($item['id']);
                            if ($existingItem->photo) {
                                $itemData['photo'] = $existingItem->photo;
                                \Log::info("Preserving existing photo for item {$index}: {$existingItem->photo}");
                            }
                        } else {
                            \Log::info("No existing photo found for item {$index}, item ID: " . ($item['id'] ?? 'null'));
                        }
                    }
                    
                    $materialRequest->items()->create($itemData);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Material request updated successfully',
                'data' => new MaterialRequestResource(
                    $materialRequest->load([
                        'requester',
                        'warehouse',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'status',
                        'items.product',
                        'items.unit',
                        'items.category',
                        'items.urgencyStatus'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update material request',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(MaterialRequest $materialRequest): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete related tasks first
            \App\Models\Task::where('material_request_id', $materialRequest->id)->delete();

            // Delete related email logs
            \App\Models\EmailLog::where('material_request_id', $materialRequest->id)->delete();

            // Delete related items first
            $materialRequest->items()->delete();

            // Delete the material request
            $materialRequest->delete();

            DB::commit();

            return response()->json([
                'message' => 'Material request deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete material request',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
