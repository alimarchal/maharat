<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Designation\StoreDesignationRequest;
use App\Http\Requests\V1\Designation\UpdateDesignationRequest;
use App\Http\Resources\V1\DesignationResource;
use App\Models\Designation;
use App\QueryParameters\DesignationParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\DB;

class DesignationController extends Controller
{
    /**
     * Display a listing of the designations.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $query = QueryBuilder::for(Designation::class)
            ->allowedFilters(DesignationParameters::ALLOWED_FILTERS)
            ->allowedSorts(DesignationParameters::ALLOWED_SORTS)
            ->allowedIncludes(DesignationParameters::ALLOWED_INCLUDES);

        // If per_page is large (e.g. 1000), return all records without pagination
        if (request()->get('per_page', 15) >= 1000) {
            $designations = $query->get();
            return response()->json([
                'data' => DesignationResource::collection($designations)
            ], Response::HTTP_OK);
        }

        $designations = $query->paginate(request()->get('per_page', 15))
            ->appends(request()->query());

        if ($designations->isEmpty()) {
            return response()->json([
                'message' => 'No designations found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return DesignationResource::collection($designations);
    }

    /**
     * Store a newly created designation in storage.
     */
    public function store(StoreDesignationRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $designation = Designation::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Designation created successfully',
                'data' => new DesignationResource($designation)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create designation',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified designation.
     */
    public function show(string $id): JsonResponse
    {
        $designation = QueryBuilder::for(Designation::class)
            ->allowedIncludes(DesignationParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new DesignationResource($designation)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified designation in storage.
     */
    public function update(UpdateDesignationRequest $request, Designation $designation): JsonResponse
    {
        try {
            DB::beginTransaction();

            $designation->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Designation updated successfully',
                'data' => new DesignationResource($designation)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update designation',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified designation from storage.
     */
    public function destroy(Designation $designation): JsonResponse
    {
        try {
            DB::beginTransaction();

            $designation->delete();

            DB::commit();

            return response()->json([
                'message' => 'Designation deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete designation',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
